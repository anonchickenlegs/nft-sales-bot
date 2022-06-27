import fs from "fs";
import fetch from "node-fetch";
import { fileTypeFromBuffer } from "file-type";

async function savePhotoFromAPI() {
  const response = await fetch(
    "https://lh3.googleusercontent.com/azzMlsp7Gc-4aIQmNBwZGfjGJjsXnQszrAQRoHaCX-l3HrYfE29cziGJI0xcv7eiQaRwgv97uz6pXtDAFhxQ-mqUl2kNuw-Ry0lzJg=w600"
  );
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileType = await fileTypeFromBuffer(buffer);
  if (fileType.ext) {
    const outputFileName = `smilesss1.${fileType.ext}`;
    fs.createWriteStream(outputFileName).write(buffer);
  } else {
    console.log(
      "File type could not be reliably determined! The binary data may be malformed! No file saved!"
    );
  }
}

savePhotoFromAPI();
