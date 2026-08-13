import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: 'cyybzecx',
  api_key: '716293343166488',
  api_secret: 'JiprV0Ibri4rz1QTlAqm2--RvB0',
  secure: true,
});

export default cloudinary;