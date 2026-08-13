const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'cyybzecx',
  api_key: '716293343166488',
  api_secret: 'JiprV0Ibri4rz1QTlAqm2--RvB0',
});

cloudinary.uploader.upload(
  'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
  { public_id: 'test-shoes' },
  (error, result) => {
    if (error) {
      console.error('Upload failed:', error);
    } else {
      console.log('Upload successful:', result.secure_url);
    }
  }
);