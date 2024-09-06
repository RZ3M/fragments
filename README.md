# fragments

Fragment Hosting

NodeJs, Docker, AWS, EC2, DynamoDB, Github

Cloud storage application that allows uploading of file "fragments". A learning project exploring the techonologies of: Amazon AWS, Docker, GitHub CI/CD, cloud storage. Builds are automatically uploaded to docker then AWS where it is built and deployed. (no longer works after student trial ended)

Users can sign up for an account with Cognito then begin uploading files. Files are securely kept through Amazon, and could only be retrieved by their respective owners. Framents is able to automatically converted between text and image formats as listed below.

Supported text file formats:
- plain
- html
- markdown
- json

Supported image conversion formats:
- jpg
- png
- gif
- webp

Video Link:

[![Fragments App](https://img.youtube.com/vi/rORvsT_bzyg/0.jpg)](https://www.youtube.com/watch?v=rORvsT_bzyg)

## To run the project

`npm start`

## To run eslint on the project

`npm run lint`

## To start dev

`npm run dev`

## To start debug

`npm run debug`
