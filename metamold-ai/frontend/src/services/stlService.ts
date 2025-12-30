/**
 * Serviço de processamento de geometria STL.
 */

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

export const getGeometryStats = (geometry: THREE.BufferGeometry) => {
  // Calcular volume aproximado (para malhas fechadas)
  const volume = geometry.attributes.position.count > 0 ? 
    calculateVolume(geometry) : 0;

  // Calcular área de superfície
  let area = 0;
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 3) {
    const v0 = new THREE.Vector3().fromBufferAttribute(pos, i);
    const v1 = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const v2 = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    area += new THREE.Triangle(v0, v1, v2).getArea();
  }

  // Calcular dimensões
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const dimensions = {
    x: bbox.max.x - bbox.min.x,
    y: bbox.max.y - bbox.min.y,
    z: bbox.max.z - bbox.min.z
  };

  // Calcular centro
  const center = new THREE.Vector3();
  center.addVectors(bbox.min, bbox.max).multiplyScalar(0.5);

  return {
    volume: Math.abs(volume),
    area,
    dimensions,
    center: [center.x, center.y, center.z],
    boundingBox: {
      min: [bbox.min.x, bbox.min.y, bbox.min.z],
      max: [bbox.max.x, bbox.max.y, bbox.max.z]
    },
    isSimulated: false
  };
};

const calculateVolume = (geometry: THREE.BufferGeometry) => {
  const pos = geometry.attributes.position;
  let volume = 0;
  
  for (let i = 0; i < pos.count; i += 3) {
    const v0 = new THREE.Vector3().fromBufferAttribute(pos, i);
    const v1 = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const v2 = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    
    // Volume do tetraedro formado pela origem e три вершини
    volume += v0.dot(v1.clone().cross(v2)) / 6;
  }
  
  return volume;
};

export const loadSTLGeometry = (url: string): Promise<THREE.BufferGeometry> => {
  return new Promise((resolve, reject) => {
    const loader = new STLLoader();
    loader.load(url, (geometry) => {
      resolve(geometry);
    }, undefined, reject);
  });
};
