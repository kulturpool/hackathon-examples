class CulturalSearch {
    constructor() {
        // OpenRouter configuration - user needs to set their API key
        this.openRouterApiKey = 'YOUR_OPENROUTER_API_KEY'; // Replace with actual API key
        this.openRouterModel = 'deepseek/deepseek-chat-v3.1:free'; // Free model

        this.currentQuery = '';
        this.isSearching = false;

        this.initializeElements();
        this.bindEvents();
        this.showApiKeyWarning();
    }

    initializeElements() {
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.searchStatus = document.getElementById('search-status');
        this.statusText = document.getElementById('status-text');
        this.resultsContainer = document.getElementById('results-container');
        this.resultsCount = document.getElementById('results-count');
        this.resultsTbody = document.getElementById('results-tbody');
        this.errorContainer = document.getElementById('error-container');
        this.errorText = document.getElementById('error-text');
        this.retryButton = document.getElementById('retry-button');
        this.noResults = document.getElementById('no-results');
    }

    bindEvents() {
        this.searchButton.addEventListener('click', () => this.performSearch());
        this.retryButton.addEventListener('click', () => this.performSearch());

        // Search on Enter key
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Clear results when input changes
        this.searchInput.addEventListener('input', () => {
            if (this.searchInput.value.trim() !== this.currentQuery) {
                this.hideAllContainers();
            }
        });
    }

    showApiKeyWarning() {
        if (this.openRouterApiKey === 'YOUR_OPENROUTER_API_KEY') {
            console.warn('⚠️  OpenRouter API Key not set!');
            console.log('To enable AI summaries:');
            console.log('1. Get an API key from https://openrouter.ai/');
            console.log('2. Replace YOUR_OPENROUTER_API_KEY in script.js');
            console.log('3. AI summaries will show as "API key not configured" until then');
        }
    }

    buildSearchUrl(query) {
        const urlParams = {
            q: query,
            sort_by: '_rand():asc',
            page: '1',
            per_page: '10', // Only need 10 results
            max_facet_values: '1',
            highlight_full_fields: 'title,description,creator,subject',
            use_cache: 'false',
            filter_by: 'edmType:=IMAGE'
        };

        const searchParams = new URLSearchParams(urlParams);
        return `https://api.kulturpool.at/search/?${searchParams.toString()}`;
    }

    async performSearch() {
        const query = this.searchInput.value.trim();

        if (!query) {
            this.searchInput.focus();
            return;
        }

        if (this.isSearching) {
            return;
        }

        this.currentQuery = query;
        this.isSearching = true;

        this.showSearchStatus('Searching cultural objects...');
        this.searchButton.disabled = true;

        try {
            await this.searchCulturalObjects(query);
        } catch (error) {
            console.error('Search error:', error);
            this.showError(`Search failed: ${error.message}`);
        } finally {
            this.isSearching = false;
            this.searchButton.disabled = false;
            this.hideSearchStatus();
        }
    }

    async searchCulturalObjects(query) {
        const searchUrl = this.buildSearchUrl(query);
        console.log(`Searching for: "${query}"`);

        const response = await fetch(searchUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.hits || !Array.isArray(data.hits)) {
            throw new Error('Invalid API response format');
        }

        if (data.hits.length === 0) {
            this.showNoResults();
            return;
        }

        // Process and display results
        const validResults = data.hits
            .filter(hit => hit.document?.previewImage && hit.document?.fullViewMetadata)
            .slice(0, 10);

        if (validResults.length === 0) {
            this.showNoResults();
            return;
        }

        this.displayResults(validResults, query);
    }

    displayResults(results, query) {
        this.hideAllContainers();

        // Update results count
        this.resultsCount.textContent = `Found ${results.length} objects for "${query}"`;

        // Clear previous results
        this.resultsTbody.innerHTML = '';

        // Create table rows for each result
        results.forEach((hit, index) => {
            const docData = hit.document;
            const row = this.createResultRow(docData, index);
            this.resultsTbody.appendChild(row);

            // Start generating AI summary asynchronously
            this.generateSummary(docData, index);
        });

        this.resultsContainer.classList.remove('hidden');
    }

    createResultRow(docData, index) {
        const row = document.createElement('tr');

        // Preview Image Cell
        const imageCell = document.createElement('td');
        if (docData.previewImage) {
            const img = document.createElement('img');
            img.src = docData.previewImage;
            img.alt = docData.title || 'Cultural object';
            img.className = 'preview-image';
            img.style.maxWidth = '400px';
            img.style.maxHeight = '400px';

            // Click to open full view
            if (docData.isShownAt) {
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => {
                    window.open(docData.isShownAt, '_blank', 'noopener,noreferrer');
                });
            }

            img.onerror = () => {
                imageCell.innerHTML = '<div class="image-placeholder">No image available</div>';
            };

            imageCell.appendChild(img);
        } else {
            imageCell.innerHTML = '<div class="image-placeholder">No image available</div>';
        }

        // Object Information Cell
        const infoCell = document.createElement('td');
        infoCell.className = 'object-info';

        const title = docData.title || 'Untitled';
        const creator = docData.creator ? (Array.isArray(docData.creator) ? docData.creator.join(', ') : docData.creator) : 'Unknown creator';
        const subject = docData.subject ? (Array.isArray(docData.subject) ? docData.subject.join(', ') : docData.subject) : '';
        const date = docData.date || '';

        infoCell.innerHTML = `
            <h4>${this.escapeHtml(title)}</h4>
            <p><strong>Creator:</strong> ${this.escapeHtml(creator)}</p>
            ${subject ? `<p><strong>Subject:</strong> ${this.escapeHtml(subject)}</p>` : ''}
            ${date ? `<p><strong>Date:</strong> ${this.escapeHtml(date)}</p>` : ''}
            ${docData.isShownAt ? `<a href="${docData.isShownAt}" target="_blank" class="object-link">View full details →</a>` : ''}
        `;

        // AI Summary Cell
        const summaryCell = document.createElement('td');
        summaryCell.id = `summary-${index}`;
        summaryCell.innerHTML = `
            <div class="summary-loading">
                <div class="spinner"></div>
                <span>Generating AI summary...</span>
            </div>
        `;

        row.appendChild(imageCell);
        row.appendChild(infoCell);
        row.appendChild(summaryCell);

        return row;
    }

    async generateSummary(docData, index) {
        const summaryCell = document.getElementById(`summary-${index}`);

        try {
            if (this.openRouterApiKey === 'YOUR_OPENROUTER_API_KEY') {
                summaryCell.innerHTML = `
                    <div class="summary-error">
                        API key not configured. Please set your OpenRouter API key to enable AI summaries.
                    </div>
                `;
                return;
            }

            if (!docData.fullViewMetadata) {
                summaryCell.innerHTML = `
                    <div class="summary-error">
                        No metadata URL available for AI summary.
                    </div>
                `;
                return;
            }

            // Fetch metadata from the fullViewMetadata URL
            console.log(`Fetching metadata for summary: ${docData.fullViewMetadata}`);
            const metadataResponse = await fetch(docData.fullViewMetadata);

            if (!metadataResponse.ok) {
                throw new Error(`Failed to fetch metadata: ${metadataResponse.status}`);
            }

            const metadataJson = await metadataResponse.json();

            // Extract only the aggregatedCHO object for AI processing
            if (!metadataJson.metadata || !metadataJson.metadata.aggregatedCHO) {
                throw new Error('No aggregatedCHO metadata found');
            }

            const aggregatedCHO = metadataJson.metadata.aggregatedCHO;
            console.log('Using aggregatedCHO metadata for AI summary:', aggregatedCHO);

            // Generate AI summary using OpenRouter with only aggregatedCHO data
            const summary = await this.callOpenRouter(aggregatedCHO);

            summaryCell.innerHTML = `
                <div class="summary-content">
                    ${this.escapeHtml(summary)}
                </div>
            `;

        } catch (error) {
            console.error(`Failed to generate summary for index ${index}:`, error);
            summaryCell.innerHTML = `
                <div class="summary-error">
                    Failed to generate summary: ${error.message}
                </div>
            `;
        }
    }

    async callOpenRouter(aggregatedCHO) {
        // Convert the aggregatedCHO object to a formatted string for the AI
        const metadataString = JSON.stringify(aggregatedCHO, null, 2);
        const prompt = `Please explain this cultural heritage object in 3 simple sentences based on the following metadata:\n\n${metadataString.substring(0, 4000)}...`; // Limit to 4000 chars for more context

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'Cultural Heritage Search'
            },
            body: JSON.stringify({
                model: this.openRouterModel,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid OpenRouter response format');
        }

        return data.choices[0].message.content.trim();
    }

    // UI Helper Methods
    showSearchStatus(message) {
        this.statusText.textContent = message;
        this.searchStatus.classList.remove('hidden');
        this.hideAllContainers();
    }

    hideSearchStatus() {
        this.searchStatus.classList.add('hidden');
    }

    showError(message) {
        this.errorText.textContent = message;
        this.hideAllContainers();
        this.errorContainer.classList.remove('hidden');
    }

    showNoResults() {
        this.hideAllContainers();
        this.noResults.classList.remove('hidden');
    }

    hideAllContainers() {
        this.resultsContainer.classList.add('hidden');
        this.errorContainer.classList.add('hidden');
        this.noResults.classList.add('hidden');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CulturalSearch();
    console.log('Cultural Heritage Search initialized');
    console.log('Enter a search term and press Enter or click Search');
    console.log('Results will include AI-generated summaries (requires OpenRouter API key)');
});