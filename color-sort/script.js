class ColorSort {
    constructor() {
        this.seasonalQueries = ['sommer', 'frühling', 'herbst', 'winter', 'natur', 'kunst', 'kultur', 'museum'];
        this.imageData = []; // Store image metadata with color information
        this.colorThief = new ColorThief();
        this.isLoading = false;
        this.currentSortMethod = 'hue';

        this.initializeElements();
        this.bindEvents();
        this.setupVisualization();
    }

    initializeElements() {
        this.loadButton = document.getElementById('load-button');
        this.progressContainer = document.getElementById('progress-container');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.sortMethod = document.getElementById('sort-method');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.retryButton = document.getElementById('retry-button');
        this.svg = d3.select('#color-chart');
    }

    bindEvents() {
        this.loadButton.addEventListener('click', () => this.loadImages());
        this.retryButton.addEventListener('click', () => this.loadImages());
        this.sortMethod.addEventListener('change', (e) => {
            this.currentSortMethod = e.target.value;
            this.updateVisualization();
        });
    }

    setupVisualization() {
        // Set up the SVG dimensions
        const container = document.getElementById('visualization');
        const rect = container.getBoundingClientRect();
        this.width = Math.max(rect.width - 40, 800);
        this.height = 600;

        this.svg
            .attr('width', this.width)
            .attr('height', this.height);

        // Create tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }

    async loadImages() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.loadButton.disabled = true;
        this.progressContainer.classList.remove('hidden');
        this.imageData = [];

        try {
            // Fetch images from multiple API calls to get 1000 images
            const totalImages = 1000;
            const batchSize = 250;
            const batches = Math.ceil(totalImages / batchSize);

            let allDocuments = [];

            for (let i = 0; i < batches; i++) {
                const documents = await this.fetchImageBatch(batchSize, i);
                allDocuments = allDocuments.concat(documents);

                const progress = Math.min(((i + 1) / batches) * 0.3, 0.3); // First 30% for fetching
                this.updateProgress(progress, `Fetching batch ${i + 1}/${batches}...`);

                if (allDocuments.length >= totalImages) {
                    break;
                }
            }

            // Limit to exactly 1000 images
            allDocuments = allDocuments.slice(0, totalImages);

            this.updateProgress(0.3, 'Analyzing colors...');

            // Analyze colors for each image
            await this.analyzeColors(allDocuments);

            this.updateProgress(1, 'Complete!');

            // Hide progress and show visualization
            setTimeout(() => {
                this.progressContainer.classList.add('hidden');
                this.createVisualization();
            }, 500);

        } catch (error) {
            console.error('Error loading images:', error);
            this.showError('Failed to load images from the API.');
        } finally {
            this.isLoading = false;
            this.loadButton.disabled = false;
        }
    }

    async fetchImageBatch(batchSize, page) {
        const urlParams = {
            q: "*",
            sort_by: '_rand():asc',
            page: (page + 1).toString(),
            per_page: batchSize.toString(),
            max_facet_values: '1',
            use_cache: 'false',
            filter_by: 'edmType:=IMAGE'
        };

        const searchParams = new URLSearchParams(urlParams);
        const apiUrl = `https://api.kulturpool.at/search/?${searchParams.toString()}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.hits || !Array.isArray(data.hits)) {
            throw new Error('Invalid API response format');
        }

        return data.hits
            .filter(hit => hit.document?.previewImage &&
                          typeof hit.document.previewImage === 'string' &&
                          hit.document.previewImage.startsWith('http') &&
                          hit.document.isShownAt)
            .map(hit => ({
                isShownAt: hit.document.isShownAt,
                title: hit.document.title || 'Untitled',
                previewImage: hit.document.previewImage
            }));
    }

    async analyzeColors(documents) {
        const batchSize = 20; // Process 20 images at a time to avoid overwhelming the browser

        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            const promises = batch.map((doc, index) =>
                this.analyzeImageColor(doc, i + index)
            );

            const results = await Promise.allSettled(promises);

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    this.imageData.push(result.value);
                }
            });

            const progress = 0.3 + ((i + batchSize) / documents.length) * 0.7;
            this.updateProgress(progress, `Analyzed ${this.imageData.length}/${documents.length} images...`);

            // Small delay to prevent browser freezing
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        console.log(`Successfully analyzed ${this.imageData.length} images`);
    }

    async analyzeImageColor(document, index) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            const timeout = setTimeout(() => {
                reject(new Error('Image load timeout'));
            }, 10000); // 10 second timeout

            img.onload = () => {
                clearTimeout(timeout);
                try {
                    const dominantColor = this.colorThief.getColor(img);
                    const [r, g, b] = dominantColor;

                    // Convert RGB to HSL for better sorting
                    const hsl = this.rgbToHsl(r, g, b);

                    resolve({
                        ...document,
                        index,
                        color: { r, g, b },
                        hsl,
                        colorHex: this.rgbToHex(r, g, b)
                    });
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load image'));
            };

            img.src = document.previewImage;
        });
    }

    createVisualization() {
        if (this.imageData.length === 0) {
            this.showError('No images were successfully analyzed.');
            return;
        }

        // Clear previous visualization
        this.svg.selectAll('*').remove();

        this.updateVisualization();
    }

    updateVisualization() {
        if (this.imageData.length === 0) return;

        // Clear previous visualization
        this.svg.selectAll('*').remove();

        // Sort images based on selected method
        const sortedData = this.sortImages(this.imageData);

        // Calculate grid dimensions - optimized for vertical-first layout
        const totalImages = sortedData.length;
        const aspectRatio = this.width / this.height;
        
        // Calculate rows first (since we fill vertically), then columns
        const rows = Math.ceil(Math.sqrt(totalImages / aspectRatio));
        const cols = Math.ceil(totalImages / rows);
        
        const cellWidth = this.width / cols;
        const cellHeight = this.height / rows;
        const imageSize = Math.min(cellWidth, cellHeight) - 2;
        
        console.log(`Grid: ${cols} cols × ${rows} rows (${totalImages} images)`);
        console.log(`Cell size: ${cellWidth.toFixed(1)} × ${cellHeight.toFixed(1)}, Image size: ${imageSize.toFixed(1)}`);
        console.log(`Canvas: ${this.width} × ${this.height}`);
        console.log(`Aspect ratio: ${aspectRatio.toFixed(2)}`);
        

        // Create image elements
        const imageGroups = this.svg.selectAll('.image-group')
            .data(sortedData)
            .enter()
            .append('g')
            .attr('class', 'image-group')
            .attr('transform', (d, i) => {
                // Reverse x/y axis: fill vertically first, then horizontally
                const row = i % rows;
                const col = Math.floor(i / rows);
                const x = col * cellWidth + cellWidth / 2;
                const y = row * cellHeight + cellHeight / 2;
                
                // Debug logging for first few images
                if (i < 5) {
                    console.log(`Image ${i}: row ${row}, col ${col} -> (${x.toFixed(1)}, ${y.toFixed(1)})`);
                }
                
                return `translate(${x}, ${y})`;
            });

        // Add color rectangles (fallback if image doesn't load)
        imageGroups.append('rect')
            .attr('class', 'color-indicator')
            .attr('x', -imageSize / 2)
            .attr('y', -imageSize / 2)
            .attr('width', imageSize)
            .attr('height', imageSize)
            .attr('fill', d => d.colorHex)
            .attr('rx', 2);

        // Add foreign object for HTML images
        const foreignObjects = imageGroups.append('foreignObject')
            .attr('x', -imageSize / 2)
            .attr('y', -imageSize / 2)
            .attr('width', imageSize)
            .attr('height', imageSize);

        foreignObjects.append('xhtml:div')
            .style('width', imageSize + 'px')
            .style('height', imageSize + 'px')
            .style('overflow', 'hidden')
            .style('border-radius', '2px')
            .append('xhtml:img')
            .attr('src', d => d.previewImage)
            .style('width', '100%')
            .style('height', '100%')
            .style('object-fit', 'cover')
            .style('cursor', 'pointer')
            .on('error', function(event, d) {
                // If image fails to load, the color rectangle will show
                d3.select(this.parentNode.parentNode).style('display', 'none');
            });

        // Add hover effects and click handlers
        imageGroups
            .on('mouseover', (event, d) => {
                this.tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);
                this.tooltip.html(`
                    <div style="text-align: center; margin-bottom: 10px;">
                        <img src="${d.previewImage}" style="max-width: 150px; max-height: 100px; object-fit: contain; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" />
                    </div>
                    <strong>${d.title}</strong><br/>
                    <div style="margin: 8px 0; padding: 4px; background: ${d.colorHex}; border-radius: 3px; color: ${d.hsl.l > 0.5 ? '#000' : '#fff'}; text-align: center; font-weight: bold;">
                        ${d.colorHex}
                    </div>
                    RGB: ${d.color.r}, ${d.color.g}, ${d.color.b}<br/>
                    Hue: ${Math.round(d.hsl.h)}°<br/>
                    Saturation: ${Math.round(d.hsl.s * 100)}%<br/>
                    Lightness: ${Math.round(d.hsl.l * 100)}%
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .on('click', (event, d) => {
                window.open(d.isShownAt, '_blank', 'noopener,noreferrer');
            });

        console.log(`Visualization created with ${sortedData.length} images`);
    }

    sortImages(data) {
        return [...data].sort((a, b) => {
            switch (this.currentSortMethod) {
                case 'hue':
                    return a.hsl.h - b.hsl.h;
                case 'brightness':
                    return a.hsl.l - b.hsl.l;
                case 'saturation':
                    return b.hsl.s - a.hsl.s; // Descending for saturation
                default:
                    return a.hsl.h - b.hsl.h;
            }
        });
    }

    updateProgress(percentage, text) {
        const percent = Math.round(percentage * 100);
        this.progressFill.style.width = percent + '%';
        this.progressText.textContent = text || `Loading... ${percent}%`;
    }

    showError(message) {
        this.error.querySelector('p').textContent = message;
        this.error.classList.remove('hidden');
        this.progressContainer.classList.add('hidden');
    }

    // Utility functions
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: h * 360,
            s: s,
            l: l
        };
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ColorSort();
    console.log('Color Sort application initialized');
});

console.log('Color Sort - Instructions:');
console.log('1. Click "Load 1000 Random Images" to fetch and analyze cultural images');
console.log('2. Wait for color analysis to complete');
console.log('3. Use the sort dropdown to change sorting method');
console.log('4. Hover over images to see color information');
console.log('5. Click on images to view their detail pages');