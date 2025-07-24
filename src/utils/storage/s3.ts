import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadFileToS3 = async (
  folderPath: string,
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  outletId: string,
  bucket: string,
): Promise<string> => {
  const ext = path.extname(originalName);
  let key;
  if (folderPath === 'menu') {
    key = `${outletId}/menu/${Date.now()}-${randomUUID()}${ext}`;
  } else if (folderPath === 'icon') {
    key = `${outletId}/icon/${Date.now()}-${randomUUID()}${ext}`;
  } else if (folderPath === 'attendance') {
    const today = new Date().toISOString().split('T')[0];
    key = `${outletId}/attendance/${today}/${Date.now()}-${randomUUID()}${ext}`;
  } else {
    throw new Error('Invalid folder path');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3.send(command);

  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
