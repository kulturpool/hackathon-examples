class FullscreenImageShuffle {
    constructor() {
        this.seasonalQueries = ['sommer', 'frühling', 'herbst', 'winter'];
        this.documents = []; // Store document metadata and image URLs
        this.preloadedImages = [];
        this.currentIndex = 0;
        this.isRunning = false;
        this.intervalId = null;
        this.preloadBuffer = 10; // Number of images to preload ahead

        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.startScreen = document.getElementById('start-screen');
        this.startButton = document.getElementById('start-button');
        this.imageDisplay = document.getElementById('image-display');
        this.currentImage = document.getElementById('current-image');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.retryButton = document.getElementById('retry-button');
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.start());
        this.retryButton.addEventListener('click', () => this.start());

        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isRunning) {
                this.stop();
            }
        });

        // Handle image load errors
        this.currentImage.addEventListener('error', () => {
            console.warn('Failed to load image, skipping to next');
            this.nextImage();
        });

        // Handle image clicks for navigation
        this.currentImage.addEventListener('click', () => {
            if (this.isRunning && this.documents[this.currentIndex]) {
                this.openDetailPage(this.documents[this.currentIndex]);
            }
        });

        // Add cursor pointer style when hovering over images
        this.currentImage.style.cursor = 'pointer';
    }

    buildApiUrl() {
        // Randomly select one of the seasonal queries
        const randomQuery = this.seasonalQueries[Math.floor(Math.random() * this.seasonalQueries.length)];

        const urlParams = {
            q: randomQuery,
            sort_by: '_rand():asc',
            page: '1',
            per_page: '100',
            max_facet_values: '1',
            use_cache: 'false',
            filter_by: 'edmType:=IMAGE'
        };

        const searchParams = new URLSearchParams(urlParams);
        const apiUrl = `https://api.kulturpool.at/search/?${searchParams.toString()}`;

        console.log(`Searching for: "${randomQuery}"`);
        console.log(`API URL: ${apiUrl}`);
        return apiUrl;
    }

    async start() {
        if (this.isRunning) return;

        this.showScreen('loading');

        try {
            await this.fetchImages();

            if (this.documents.length === 0) {
                throw new Error('No images found');
            }

            await this.preloadInitialImages();
            this.startSlideshow();

        } catch (error) {
            console.error('Error starting slideshow:', error);
            this.showError('Failed to load images from the API.');
        }
    }

    async fetchImages() {
        try {
            const apiUrl = this.buildApiUrl();
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.hits || !Array.isArray(data.hits)) {
                throw new Error('Invalid API response format');
            }

            // Extract document metadata including image URLs, filtering out invalid ones
            this.documents = data.hits
                .filter(hit => hit.document?.previewImage &&
                              typeof hit.document.previewImage === 'string' &&
                              hit.document.previewImage.startsWith('http') &&
                              hit.document.isShownAt)
                .slice(0, 100) // Limit to 100 images for performance
                .map(hit => ({
                    isShownAt: hit.document.isShownAt,
                    title: hit.document.title || 'Untitled',
                    previewImage: hit.document.previewImage
                }));

            console.log(`Loaded ${this.documents.length} documents with images and metadata`);

            if (this.documents.length === 0) {
                throw new Error('No valid images found in API response');
            }

        } catch (error) {
            console.error('Error fetching images:', error);
            throw error;
        }
    }

    async preloadInitialImages() {
        const imagesToPreload = Math.min(this.preloadBuffer, this.documents.length);
        const preloadPromises = [];

        for (let i = 0; i < imagesToPreload; i++) {
            preloadPromises.push(this.preloadImage(i));
        }

        // Wait for at least the first few images to load
        try {
            await Promise.allSettled(preloadPromises);
        } catch (error) {
            console.warn('Some images failed to preload:', error);
        }
    }

    async preloadImage(index) {
        if (index >= this.documents.length || this.preloadedImages[index]) {
            return;
        }

        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                this.preloadedImages[index] = img;
                resolve(img);
            };

            img.onerror = () => {
                console.warn(`Failed to preload image ${index}: ${this.documents[index].previewImage}`);
                reject(new Error(`Failed to load image ${index}`));
            };

            img.src = this.documents[index].previewImage;
        });
    }

    startSlideshow() {
        this.isRunning = true;
        this.currentIndex = 0;

        this.showScreen('image-display');
        this.displayCurrentImage();

        // Start the interval for changing images
        this.intervalId = setInterval(() => {
            this.nextImage();
        }, 250); // 250ms as requested
    }

    nextImage() {
        if (!this.isRunning || this.documents.length === 0) return;

        this.currentIndex = (this.currentIndex + 1) % this.documents.length;
        this.displayCurrentImage();

        // Preload the next batch of images
        this.preloadNextBatch();
    }

    displayCurrentImage() {
        const document = this.documents[this.currentIndex];
        const imageUrl = document.previewImage;

        // Use preloaded image if available, otherwise load directly
        if (this.preloadedImages[this.currentIndex]) {
            this.currentImage.src = this.preloadedImages[this.currentIndex].src;
        } else {
            this.currentImage.src = imageUrl;
            // Try to preload this image for next time
            this.preloadImage(this.currentIndex).catch(() => {
                // Ignore preload failures
            });
        }
    }

    preloadNextBatch() {
        // Preload the next 10 images ahead of current position
        for (let i = 1; i <= this.preloadBuffer; i++) {
            const nextIndex = (this.currentIndex + i) % this.documents.length;
            if (!this.preloadedImages[nextIndex]) {
                this.preloadImage(nextIndex).catch(() => {
                    // Ignore preload failures
                });
            }
        }
    }

    stop() {
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.showScreen('start-screen');
    }

    showScreen(screenName) {
        // Hide all screens
        this.startScreen.classList.add('hidden');
        this.imageDisplay.classList.add('hidden');
        this.loading.classList.add('hidden');
        this.error.classList.add('hidden');

        // Show the requested screen
        switch (screenName) {
            case 'start-screen':
                this.startScreen.classList.remove('hidden');
                break;
            case 'image-display':
                this.imageDisplay.classList.remove('hidden');
                break;
            case 'loading':
                this.loading.classList.remove('hidden');
                break;
            case 'error':
                this.error.classList.remove('hidden');
                break;
        }
    }

    showError(message) {
        this.error.querySelector('p').textContent = message;
        this.showScreen('error');
    }

    openDetailPage(document) {
        if (!document.isShownAt) {
            console.warn('Missing isShownAt URL for document:', document);
            return;
        }

        const detailUrl = document.isShownAt;
        console.log(`Opening detail page: ${detailUrl}`);
        console.log(`Title: ${document.title}`);

        // Open in new window/tab
        window.open(detailUrl, '_blank', 'noopener,noreferrer');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FullscreenImageShuffle();
    console.log('Fullscreen Image Shuffle initialized');
});

// Add some helpful console messages
console.log('Fullscreen Image Shuffle - Controls:');
console.log('- Click "Start Image Shuffle" to begin');
console.log('- Press Escape to stop the slideshow');
console.log('- Click on any image to open its detail page');
console.log('- Images change every 250ms');
console.log('- 10 images are preloaded ahead for smooth playback');
