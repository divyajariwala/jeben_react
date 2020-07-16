import vision from "@react-native-firebase/ml-vision";

export async function hasValidFaces(localFilePath) {
  const result = await vision().faceDetectorProcessImage(localFilePath, {
    performanceMode: vision.VisionFaceDetectorPerformanceMode.ACCURATE
  });

  result.forEach(visionFace => {
    console.log(`Face detected at ${visionFace.boundingBox}`);
  });

  return result.length > 0;
}
