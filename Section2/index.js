import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import sesClientModule from "@aws-sdk/client-ses";
import * as fs from 'fs';
import nodemailer from "nodemailer";

const client = new S3Client({});
// Array to store uploaded file details
const uploadedFiles = [];

export const handler = async (event) => {
  if (event.Records) {
    console.log("S3 triggered");
    await s3Handler('bucket name');
  } else if (event.source == "aws.events") {
    console.log("Email triggered");
    emailHandler();
  }
};

// Function to monitor S3 bucket
async function s3Handler(bucketName) {
  const command = new ListObjectsV2Command({ Bucket: bucketName });

  try {
    let isTruncated = true;
    uploadedFiles.length = 0;
    console.log("Your bucket contains the following objects:\n");
    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } = await client.send(command);
      for (var index in Contents) {
        processUploadedFile(`s3://${bucketName}/${Contents[index].Key}`, Contents[index].Key, Contents[index].Size, Contents[index].Key.split('.').pop());
      }
      isTruncated = IsTruncated;
      command.input.ContinuationToken = NextContinuationToken;
    }
  } catch (err) {
    console.error(err);
  }
}

// Function to process uploaded files
function processUploadedFile(s3Uri, objectKey, objectSize, objectType) {
  // Store file details
  uploadedFiles.push({ s3Uri, objectKey, objectSize, objectType });
  console.log("Pushed data to array: ", uploadedFiles);
  // Check if object is an image
  if (['jpg', 'jpeg', 'png', 'svg'].includes(objectType.toLowerCase())) {
    // Create 'thumbnail'
    console.log("Making thumbs...");
  }
}

// Function to create JSON file with uploaded file details
function emailHandler() {
  const jsonData = JSON.stringify(uploadedFiles, null, 2);
  console.log(jsonData);
  fs.writeFile('/tmp/uploaded_files.json', jsonData, err => {
    if (err) {
      console.error('Error writing JSON file:', err);
    } else {
      // Send email if JSON file is created
      console.log('JSON file created');
      // Email options
      sendEmailWithAttachments(jsonData);
    }
  });
}

function sendEmailWithAttachments(jsonData) {
  const ses = new sesClientModule.SESClient({});
  const transporter = nodemailer.createTransport({
    SES: { ses, aws: sesClientModule },
  });

  return new Promise((resolve, reject) => {
    transporter.sendMail({
      from: "Sender Email", 
      to: "Recipient Email", 
      subject: "Files in S3 bucket",
      text: "Here are the uploaded files",
      attachments: [{ content: `${jsonData}`, filename: "/tmp/uploaded_files.json" }],
    },
      (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve(info);
        }
      },
    );
  });
}