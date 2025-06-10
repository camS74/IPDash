import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSalesData } from '../../contexts/SalesDataContext';
import { useExcelData } from '../../contexts/ExcelDataContext';
import './SalesCountryGlobe.css';

const SalesCountryGlobe = () => {
  // const { salesData, loading: salesLoading } = useSalesData(); // TODO: Will be used for country data
  const { selectedDivision } = useExcelData();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const globeRef = useRef(null);
  const cameraRef = useRef(null);
  const animationRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup - improved for better globe viewing
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.5); // Better initial distance
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Clear any existing children
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    
    // Load starfield background
    textureLoader.load(
      '/assets/starfield.jpg',
      (starfieldTexture) => {
        // Create sphere geometry for starfield background
        const starfieldGeometry = new THREE.SphereGeometry(50, 32, 32);
        const starfieldMaterial = new THREE.MeshBasicMaterial({
          map: starfieldTexture,
          side: THREE.BackSide
        });
        const starfield = new THREE.Mesh(starfieldGeometry, starfieldMaterial);
        scene.add(starfield);
      },
      undefined,
      (error) => {
        console.warn('Could not load starfield texture:', error);
      }
    );

    // Load earth texture and create globe
    textureLoader.load(
      '/assets/world2.jpg',
      (earthTexture) => {
        // Create globe geometry
        const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
        
        // Create globe material
        const globeMaterial = new THREE.MeshPhongMaterial({
          map: earthTexture,
          transparent: false,
          opacity: 1
        });

        // Create globe mesh
        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globe.castShadow = true;
        globe.receiveShadow = true;
        scene.add(globe);
        globeRef.current = globe;

        setIsLoading(false);
      },
      (progress) => {
        console.log('Loading earth texture:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Could not load earth texture:', error);
        setError('Failed to load earth texture');
        setIsLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Rotate the globe slowly (increased speed for visibility)
      if (globeRef.current) {
        globeRef.current.rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
    };
    
    // Start animation
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Mouse controls for rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (event) => {
      isDragging = true;
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseMove = (event) => {
      if (!isDragging || !globeRef.current) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      globeRef.current.rotation.y += deltaMove.x * 0.01;
      globeRef.current.rotation.x += deltaMove.y * 0.01;

      // Improved vertical rotation limits to prevent pole cutoff
      globeRef.current.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeRef.current.rotation.x));

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Improved zoom controls - smoother and better limits
    const handleWheel = (event) => {
      event.preventDefault();
      
      // Smoother zoom with smaller increments
      const zoomSpeed = 0.002;
      const delta = event.deltaY * zoomSpeed;
      
      camera.position.z += delta;
      
      // Better zoom limits to prevent cutting off poles and getting too far
      camera.position.z = Math.max(2.0, Math.min(8.0, camera.position.z));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseUp);
        canvas.removeEventListener('wheel', handleWheel);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      
      if (mountRef.current && mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    };
  }, []);

  // Get division info for display
  const divisionName = selectedDivision?.split('-')[0] || 'FP';

  if (error) {
    return (
      <div className="globe-container">
        <div className="globe-header">
          <h3>🌍 3D Globe - Sales by Country - {divisionName}</h3>
        </div>
        <div className="globe-error">
          <p>❌ {error}</p>
          <p>Please check that the texture files are available in the public/assets folder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="globe-container">
      <div className="globe-header">
        <h3>🌍 3D Globe - Sales by Country - {divisionName}</h3>
        <div className="globe-controls">
          <p>🖱️ Click and drag to rotate • 🖲️ Scroll to zoom • High-resolution textures</p>
        </div>
      </div>
      
      {isLoading && (
        <div className="globe-loading">
          <div className="loading-spinner"></div>
          <p>Loading high-resolution Earth textures...</p>
        </div>
      )}
      
      <div 
        ref={mountRef} 
        className="globe-mount"
        style={{ 
          width: '100%', 
          height: '80vh', // Responsive height based on viewport
          minHeight: '600px', // Minimum height to ensure proper aspect ratio
          maxHeight: '800px', // Maximum height to prevent it getting too tall
          background: 'linear-gradient(to bottom, #000428, #004e92)',
          borderRadius: '10px',
          overflow: 'hidden',
          aspectRatio: '16/12' // Closer to square for better globe viewing
        }}
      />
      
      <div className="globe-info">
        <p>Interactive 3D Earth with high-resolution textures • Smooth zoom controls • Optimized for globe viewing</p>
      </div>
    </div>
  );
};

export default SalesCountryGlobe; 