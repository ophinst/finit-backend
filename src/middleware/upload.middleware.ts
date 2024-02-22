import { Request, Response, NextFunction, RequestHandler } from "express";
import * as multer from "multer";

// Define the type for the Multer request
interface MulterRequest extends Request {
    file: Express.Multer.File;
}

// Create a Multer instance
const upload: RequestHandler = multer({
	storage: multer.memoryStorage(), // Call the function to create memory storage
	limits: {
		fileSize:  5 *  1024 *  1024, //  5MB
	},
}).single("image");

class UploadMiddleware {
	// Define an async function to handle the file upload
	public async ProcessFiles(req: MulterRequest, res: Response, next: NextFunction): Promise<void> {
		try {
			// Process the file upload
			await new Promise<void>((resolve, reject) => {
				upload(req, res, (error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			});
			next();
		} catch (error) {
			res.status(500).send(error);
		}
	}
}

export default new UploadMiddleware();
