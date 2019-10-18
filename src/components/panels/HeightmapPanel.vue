<style scoped>
.loading {
	background-color: black;
}
.loading h1{
	color: white;
}
.loading,
.canvas {
	border-radius: 8px 0 0 8px;
}
.legend {
	border-radius: 0 8px 8px 0;
}
canvas {
	display: flex;
	min-height: 480px;
}
.no-cursor {
	pointer-events: none;
}
</style>

<template>
	<div class="component">
		<v-card class="card">
			<v-container ref="container" class="pa-1" fluid>
				<v-layout row wrap fill-height>
					<v-flex class="heightmap-container pa-2" xs12 sm12 md9 lg10 xl10>
						<v-layout ref="parentElement" row fill-height>
							<v-flex class="loading" v-show="!ready">
								<v-layout fill-height align-center>
									<v-flex tag="h1" class="text-xs-center">
										{{ loading ? $t('generic.loading') : (errorMessage ? errorMessage : $t('panel.heightmap.notAvailable')) }}
									</v-flex>
								</v-layout>
							</v-flex>
							<v-flex v-show="ready" shrink>
								<canvas ref="canvas" class="canvas" @mousemove="canvasMouseMove"></canvas>
							</v-flex>
							<v-flex d-flex shrink>
								<canvas ref="legend" class="legend" width="80"></canvas>
							</v-flex>
						</v-layout>
					</v-flex>

					<v-flex class="pa-2" xs12 sm12 md3 lg2 xl2>
						<v-layout column fill-height justifiy-space-between>
							<v-flex class="pt-2">
								{{ $t('panel.heightmap.numPoints', [$display(numPoints, 0)]) }}
							</v-flex>
							<v-flex>
								{{ $t('panel.heightmap.maxDeviations', [$display(minDiff, 3), $display(maxDiff, 3, 'mm')]) }}
							</v-flex>
							<v-flex>
								{{ $t('panel.heightmap.meanError', [$display(meanError, 3, 'mm')]) }}
							</v-flex>
							<v-flex>
								{{ $t('panel.heightmap.rmsError', [$display(rmsError, 3, 'mm')]) }}
							</v-flex>
							<v-flex shrink>
								Display
							</v-flex>
							<v-flex>
								<v-btn-toggle mandatory v-model="displayType">
									<v-btn value="mesh">Mesh</v-btn>
									<v-btn value="probed">Probed Points</v-btn>
								</v-btn-toggle>
							</v-flex>
							<v-flex shrink>
								{{ $t('panel.heightmap.colorScheme') }}
							</v-flex>
							<v-flex>
								<v-btn-toggle mandatory v-model="colorScheme">
									<v-btn value="terrain">{{ $t('panel.heightmap.terrain') }}</v-btn>
									<v-btn value="heat">{{ $t('panel.heightmap.heat') }}</v-btn>
								</v-btn-toggle>
							</v-flex>
							<v-flex>
								<v-btn class="ml-0" :disabled="!ready" @click="topView">
									<v-icon small class="mr-1">vertical_align_bottom</v-icon> {{ $t('panel.heightmap.topView') }}
								</v-btn>
							</v-flex>
							<v-flex shrink>
								<v-btn class="ml-0" :disabled="!isConnected" :loading="loading" @click="getHeightmap()">
									<v-icon class="mr-1">refresh</v-icon> {{ $t('panel.heightmap.reload') }}
								</v-btn>
							</v-flex>
						</v-layout>
					</v-flex>
				</v-layout>
			</v-container>
		</v-card>

		<v-tooltip top absolute v-model="tooltip.shown" :position-x="tooltip.x" :position-y="tooltip.y">
			<span class="no-cursor">
				X: {{ $display(tooltip.coord.x, 1, 'mm') }}<br/>
				Y: {{ $display(tooltip.coord.y, 1, 'mm') }}<br/>
				Z: {{ $display(tooltip.coord.z, 3, 'mm') }}
			</span>
		</v-tooltip>
	</div>
</template>

<script>
'use strict'

import { mapState, mapGetters } from 'vuex'

import { Scene, PerspectiveCamera, WebGLRenderer, Raycaster, Mesh, MeshBasicMaterial, Vector2, Vector3, VertexColors, DoubleSide, ArrowHelper, GridHelper } from 'three'
import OrbitControls from 'three-orbitcontrols'

import { drawLegend, setFaceColors, generateIndicators, generateMeshGeometry } from '../../utils/3d.js'

const scaleZ = 0.5, maxVisualizationZ = 0.25
const indicatorColor = 0xFFFFFF, indicatorOpacity = 0.4, indicatorOpacityHighlighted = 1.0

let threeInstances = []
window.addEventListener('resize', function() {
	threeInstances.forEach(instance => instance.resize())
})

export default {
	beforeCreate() {
		this.three = {						// non-reactive data
			scene: null,
			camera: null,
			renderer: null,
			orbitControls: null,
			raycaster: null,

			hasHelpers: false,
			meshGeometry: null,
			meshPlane: null,
			meshIndicators: null,
			lastIntersection: null
		}
	},
	computed: {
		...mapGetters(['isConnected']),
		...mapGetters('machine', ['client']),
		...mapState('settings', ['language'])
	},
	data() {
		return {
			isActive: true,
			ready: false,
			loading: false,
			errorMessage: null,

			colorScheme: 'terrain',
			displayType: 'mesh',
			tooltip: {
				coord: {
					x: 0,
					y: 0,
					z: 0
				},
				x: undefined,
				y: undefined,
				shown: false
			},
			numPoints: undefined,			// points excluding NaN
			minDiff: undefined,
			maxDiff: undefined,
			meanError: undefined,
			rmsError: undefined,
		}
	},
	methods: {
		init() {
			// Perform initial resize
			const size = this.resize();

			// Create THREE instances
			this.three.scene = new Scene();
			this.three.camera = new PerspectiveCamera(45, size.width / size.height, 0.1, 1000);
			this.three.camera.position.set(1, 1, 1);
			this.three.camera.up = new Vector3(0, 0, 1);
			this.three.renderer = new WebGLRenderer({ canvas: this.$refs.canvas });
			this.three.renderer.setSize(size.width, size.height);
			this.three.orbitControls = new OrbitControls(this.three.camera, this.three.renderer.domElement);
			this.three.orbitControls.enableKeys = false;
			this.three.raycaster = new Raycaster();

			// Register this instance in order to deal with size changes
			threeInstances.push(this);
			if (this.isConnected) {
				this.getHeightmap();
			}
		},
		resize() {
			if (!this.isActive) {
				return;
			}

			// Resize canvas elements
			const containerOffset = this.$refs.container.scrollWidth - this.$refs.container.offsetWidth;
			const width = this.$refs.parentElement.offsetWidth - this.$refs.legend.offsetWidth - containerOffset;
			const height = this.$refs.parentElement.offsetHeight;
			this.$refs.legend.height = height;
			this.$refs.canvas.width = width;
			this.$refs.canvas.height = height;

			// Resize the 3D height map
			if (this.three.renderer) {
				this.three.camera.aspect = width / height;
				this.three.camera.updateProjectionMatrix();
				this.three.renderer.setSize(width, height);
			}

			// Redraw the legend and return the canvas size
			drawLegend(this.$refs.legend, maxVisualizationZ, this.colorScheme);
			return { width, height };
		},
		showHeightmap(points) {
			// Clean up first
			if (this.three.meshGeometry) {
				this.three.scene.remove(this.three.meshPlane);
				this.three.meshIndicators.forEach(function(indicator) {
					this.remove(indicator);
				}, this.three.scene);

				this.three.meshGeometry = null;
				this.three.meshPlane = null;
				this.three.meshIndicators = null;
				this.three.lastIntersection = null;
			}

			// Generate stats
			let xMin, xMax, yMin, yMax;

			this.numPoints = 0;
			this.minDiff = undefined;
			this.maxDiff = undefined;
			this.meanError = 0;
			this.rmsError = 0;

			for (let i = 0; i < points.length; i++) {
				const z = points[i][2];
				if (!isNaN(z)) {
					const x = points[i][0];
					const y = points[i][1];
					if (xMin === undefined || xMin > x) { xMin = x; }
					if (xMax === undefined || xMax < x) { xMax = x; }
					if (yMin === undefined || yMin > y) { yMin = y; }
					if (yMax === undefined || yMax < y) { yMax = y; }

					this.numPoints++;
					this.meanError += z;
					this.rmsError += z * z;
					if (this.minDiff === undefined || this.minDiff > z) { this.minDiff = z; }
					if (this.maxDiff === undefined || this.maxDiff < z) { this.maxDiff = z; }
				}
			}

			this.rmsError = Math.sqrt(((this.rmsError * this.numPoints) - (this.meanError * this.meanError))) / this.numPoints;
			this.meanError = this.meanError / this.numPoints;

			// Generate mesh geometry and apply face colors
			this.three.meshGeometry = generateMeshGeometry(points, xMin, xMax, yMin, yMax, scaleZ);
			setFaceColors(this.three.meshGeometry, scaleZ, this.colorScheme, maxVisualizationZ);

			// Make 3D mesh and add it
			const material = new MeshBasicMaterial({ vertexColors: VertexColors, side: DoubleSide });
			this.three.meshPlane = new Mesh(this.three.meshGeometry, material);
			this.three.scene.add(this.three.meshPlane);

			// Make indicators and add them
			this.three.meshIndicators = generateIndicators(this.three.meshGeometry, this.numPoints, scaleZ, indicatorColor, indicatorOpacity);
			this.three.meshIndicators.forEach(function(indicator) {
				this.add(indicator);
			}, this.three.scene);

			if (!this.three.hasHelpers) {
				// Make axis arrows for XYZ
				this.three.scene.add(new ArrowHelper(new Vector3(1, 0, 0), new Vector3(-0.6, -0.6, 0), 0.5, 0xFF0000));
				this.three.scene.add(new ArrowHelper(new Vector3(0, 1, 0), new Vector3(-0.6, -0.6, 0), 0.5, 0x00FF00));
				this.three.scene.add(new ArrowHelper(new Vector3(0, 0, 1), new Vector3(-0.6, -0.6, 0), 0.5, 0x0000FF));

				// Make grid on XY plane
				const grid = new GridHelper(1.1, 15);
				grid.rotation.x = -Math.PI / 2;
				this.three.scene.add(grid);

				// Don't add these helpers again
				this.three.hasHelpers = true;
			}

			// Render scene
			this.ready = true;
			this.resize();
			this.render();
		},
		render() {
			if (this.three.renderer) {
				requestAnimationFrame(this.render);
				this.three.renderer.render(this.three.scene, this.three.camera);
			}
		},
		canvasMouseMove(e) {
			if (!e.clientX || !this.three.meshGeometry) {
				return;
			}

			// Try to get the Z value below the cursor
			// For that we need normalized X+Y coordinates between -1.0 and 1.0
			const rect = e.target.getBoundingClientRect();
			const mouse = new Vector2();
			mouse.x = (e.clientX - rect.left) / e.target.clientWidth * 2 - 1;
			mouse.y = -(e.clientY - rect.top) / e.target.clientHeight * 2 + 1;

			// Is the cursor on a point indicator?
			this.three.raycaster.setFromCamera(mouse, this.three.camera);
			const intersection = this.three.raycaster.intersectObjects(this.three.meshIndicators);
			if (this.three.lastIntersection && (intersection.length === 0 || intersection[0] !== this.three.lastIntersection)) {
				this.three.lastIntersection.object.material.opacity = indicatorOpacity;
				this.three.lastIntersection = undefined;
			}

			let intersectionPoint;
			if (intersection.length > 0) {
				if (intersection[0] !== this.three.lastIntersection) {
					intersection[0].object.material.opacity = indicatorOpacityHighlighted;
					this.three.lastIntersection = intersection[0];
				}
				intersectionPoint = intersection[0].object.coords;
			}

			// Show or hide the tooltip
			if (intersectionPoint) {
				this.tooltip.coord.x = intersectionPoint.x;
				this.tooltip.coord.y = intersectionPoint.y;
				this.tooltip.coord.z = intersectionPoint.z;
				this.tooltip.x = e.clientX;
				this.tooltip.y = e.clientY;
				this.tooltip.shown = true;
			} else {
				this.tooltip.shown = false;
			}
		},
		topView() {
			this.three.camera.position.set(0, 0, 1.5);
			this.three.camera.rotation.set(0, 0, 0);
			this.three.camera.updateProjectionMatrix();
		},

		async getHeightmap() {
			if (this.loading) {
				// Don't attempt to load more than one file at once...
				return;
			}

			this.ready = false;
			this.loading = true;
			try {
				const {data} = await this.client.get('machine/bed_mesh/height_map');
				this.data = data
				this.showHeightmap(this.data[this.displayType])
			} catch (e) {
				this.errorMessage = e.message;
			}
			this.loading = false;
		},
	},
	activated() {
		this.isActive = true;
		this.resize();
	},
	deactivate() {
		this.isActive = false;
	},
	mounted() {
		// FIXME give the grid some time to resize everything...
		setTimeout(this.init, 100);
	},
	beforeDestroy() {
		threeInstances = threeInstances.filter(item => item !== this);
		if (this.three.renderer) {
			this.three.renderer.forceContextLoss();
			this.three.renderer = null;
		}
	},
	watch: {
		displayType(value){
			if (this.data) {
				this.showHeightmap(this.data[value])
			}
		},
		colorScheme(to) {
			if (this.three.meshGeometry) {
				setFaceColors(this.three.meshGeometry, scaleZ, to, maxVisualizationZ);
			}
			drawLegend(this.$refs.legend, maxVisualizationZ, to);
		},
		isConnected(to) {
			if (to) {
				this.getHeightmap();
			}
		},
		language() {
			drawLegend(this.$refs.legend, maxVisualizationZ, this.colorScheme);
		}
	}
}
</script>
