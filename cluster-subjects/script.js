// Fetch all results for dataProvider 'Brenner Forum' from Kulturpool Search API
async function fetchAllBrennerForumData() {
	const baseUrl = 'https://api.kulturpool.at/search';
	const perPage = 50;
	let page = 1;
	let allResults = [];
	let found = 0;

	do {
		const url = `${baseUrl}/?q=*&filter_by=dataProvider:=Brenner%20Forum&page=${page}&per_page=${perPage}`;
		const response = await fetch(url);
		const data = await response.json();
        console.log(data)

		if (page === 1) found = data.found;
		allResults = allResults.concat(data.hits.map(hit => hit.document));
		page++;
	} while (allResults.length < 300);

	return allResults;
}

// Example usage: fetch and log all results
fetchAllBrennerForumData().then(results => {
	console.log('Total results:', results.length);
	renderD3Nodes(results);
});

// Render D3 nodes on canvas with images and titles
function renderD3Nodes(data) {
	const canvas = document.getElementById('forceCanvas');
	const context = canvas.getContext('2d');
	const width = canvas.width = canvas.offsetWidth;
	const height = canvas.height = canvas.offsetHeight;

	// Prepare nodes (only those with previewImage)
	const nodes = data.filter(d => d.previewImage && d.title).map((d, i) => ({
		id: i,
		img: d.previewImage,
		title: Array.isArray(d.title) ? d.title[0] : d.title,
		subject: d.subject || [],
		medium: d.medium || [],
		isShownAt: d.isShownAt,
		fullViewMetadata: d.fullViewMetadata,
		x: Math.random() * width,
		y: Math.random() * height,
		r: 32
	}));

	// Create links for shared attributes
	const links = [];
	for (let i = 0; i < nodes.length; i++) {
		for (let j = i + 1; j < nodes.length; j++) {
			// Check for shared subject or medium
			const sharedSubject = nodes[i].subject.some(s => nodes[j].subject.includes(s));
			const sharedMedium = nodes[i].medium.some(m => nodes[j].medium.includes(m));
			if (sharedSubject || sharedMedium) {
				links.push({ source: i, target: j });
			}
		}
	}

	// Load images
	let loaded = 0;
	nodes.forEach(node => {
		const image = new window.Image();
		image.src = node.img;
		image.onload = () => {
			node.imageObj = image;
			loaded++;
			if (loaded === nodes.length) {
				// Wait longer for simulation to settle after all images loaded
				let settleTime = 5000; // ms to let forces apply
				setTimeout(() => {
					lockNodes();
				}, settleTime);
			}
		};
		image.onerror = () => {
			node.imageObj = null;
			loaded++;
			if (loaded === nodes.length) {
				let settleTime = 5000;
				setTimeout(() => {
					lockNodes();
				}, settleTime);
			}
		};
	});

	// D3 force simulation
	const simulation = d3.forceSimulation(nodes)
	.force('charge', d3.forceManyBody().strength(-400))
		.force('center', d3.forceCenter(width / 2, height / 2))
		.force('collision', d3.forceCollide().radius(d => d.r + 80))
	.force('link', d3.forceLink(links).distance(10).strength(0.7))
		.on('tick', draw);

	// Lock nodes and stop simulation, then enable dragging
	function lockNodes() {
		// Double-click to open isShownAt link in foreground tab
		canvas.addEventListener('dblclick', onDoubleClickNode);

		function onDoubleClickNode(event) {
			const pos = getMousePos(event);
			for (let node of nodes) {
				const dx = pos.x - node.x;
				const dy = pos.y - node.y;
				if (Math.sqrt(dx*dx + dy*dy) < node.r) {
					if (node.isShownAt) {
						const win = window.open(node.isShownAt, '_blank');
						if (win) win.focus();
					}
					break;
				}
			}
		}
		simulation.stop();
		nodes.forEach(node => {
			node.fx = node.x;
			node.fy = node.y;
		});
		draw();

		// Enable node dragging
		let draggedNode = null;
		let offset = {x: 0, y: 0};
		let isPanning = false;
		let panStart = {x: 0, y: 0};
		let panTransformStart = {x: 0, y: 0};
		canvas.addEventListener('mousedown', onMouseDown);

		function getMousePos(event) {
			const rect = canvas.getBoundingClientRect();
			// Adjust for pan/zoom
			const x = (event.clientX - rect.left - transform.x) / transform.k;
			const y = (event.clientY - rect.top - transform.y) / transform.k;
			return {x, y};
		}

		function onMouseDown(event) {
			const pos = getMousePos(event);
			let foundNode = null;
			for (let node of nodes) {
				const dx = pos.x - node.x;
				const dy = pos.y - node.y;
				if (Math.sqrt(dx*dx + dy*dy) < node.r) {
					foundNode = node;
					break;
				}
			}
			if (foundNode) {
				// Start dragging node
				draggedNode = foundNode;
				offset.x = pos.x - draggedNode.x;
				offset.y = pos.y - draggedNode.y;
				canvas.addEventListener('mousemove', onMouseMoveNode);
				canvas.addEventListener('mouseup', onMouseUpNode);
			} else {
				// Start panning canvas
				isPanning = true;
				panStart.x = event.clientX;
				panStart.y = event.clientY;
				panTransformStart.x = transform.x;
				panTransformStart.y = transform.y;
				canvas.addEventListener('mousemove', onMouseMovePan);
				canvas.addEventListener('mouseup', onMouseUpPan);
			}
		}

		function onMouseMoveNode(event) {
			if (draggedNode) {
				const pos = getMousePos(event);
				draggedNode.x = pos.x - offset.x;
				draggedNode.y = pos.y - offset.y;
				draw();
			}
		}

		function onMouseUpNode(event) {
			if (draggedNode) {
				draggedNode = null;
				canvas.removeEventListener('mousemove', onMouseMoveNode);
				canvas.removeEventListener('mouseup', onMouseUpNode);
			}
		}

		function onMouseMovePan(event) {
			if (isPanning) {
				const dx = event.clientX - panStart.x;
				const dy = event.clientY - panStart.y;
				transform = d3.zoomIdentity.translate(panTransformStart.x + dx, panTransformStart.y + dy).scale(transform.k);
				draw();
			}
		}

		function onMouseUpPan(event) {
			if (isPanning) {
				isPanning = false;
				canvas.removeEventListener('mousemove', onMouseMovePan);
				canvas.removeEventListener('mouseup', onMouseUpPan);
			}
		}
	}

	// Pan and zoom
	let transform = d3.zoomIdentity;
	d3.select(canvas).call(d3.zoom()
		.scaleExtent([0.2, 5])
		.on('zoom', (event) => {
			transform = event.transform;
			draw();
		})
	);

	function draw() {
		context.save();
		context.clearRect(0, 0, width, height);
		context.translate(transform.x, transform.y);
		context.scale(transform.k, transform.k);
		nodes.forEach(node => {
			if (node.imageObj) {
				context.save();
				context.beginPath();
				context.arc(node.x, node.y, node.r, 0, 2 * Math.PI);
				context.closePath();
				context.clip();

				// Calculate image draw size and position for object-fit: cover
				const imgW = node.imageObj.width;
				const imgH = node.imageObj.height;
				const diameter = node.r * 2;
				const imgRatio = imgW / imgH;
				const nodeRatio = 1; // circle is always 1:1
				let drawW, drawH;
				if (imgRatio > nodeRatio) {
					// Image is wider than node, fit height, crop width
					drawH = diameter;
					drawW = diameter * imgRatio;
				} else {
					// Image is taller or square, fit width, crop height
					drawW = diameter;
					drawH = diameter / imgRatio;
				}
				context.drawImage(
					node.imageObj,
					node.x - drawW / 2,
					node.y - drawH / 2,
					drawW,
					drawH
				);
				context.restore();
			} else {
				// fallback circle
				context.beginPath();
				context.arc(node.x, node.y, node.r, 0, 2 * Math.PI);
				context.fillStyle = '#ccc';
				context.fill();
			}
			// Draw title
			context.font = '14px Arial';
			context.fillStyle = '#222';
			context.textAlign = 'center';
			// Give even more horizontal space for the title (up to 14x node radius)
			context.fillText(node.title, node.x, node.y + node.r + 18, node.r * 14);
		});
		context.restore();
	}
}
