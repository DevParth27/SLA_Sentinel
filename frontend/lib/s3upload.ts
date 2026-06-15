export async function uploadToS3(file: File): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fakeKey = `contracts/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      resolve(`https://sla-sentinel-dev.s3.ap-south-1.amazonaws.com/${fakeKey}`);
    }, 2000);
  });
}
