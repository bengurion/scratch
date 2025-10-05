const multer = require('multer');
const ProjectStorage = require('./project-storage');

// Initialize storage
const storage = new ProjectStorage();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for .sb3 files
    },
    fileFilter: (req, file, cb) => {
        // Accept .sb3 files and any file for flexibility
        if (file.originalname.endsWith('.sb3') || file.mimetype === 'application/octet-stream') {
            cb(null, true);
        } else {
            cb(new Error('Only .sb3 files are allowed'), false);
        }
    }
});

class ProjectAPI {
    // Save a project (POST /api/projects)
    static async saveProject(req, res) {
        try {
            let projectData;
            let projectId = req.body.projectId || null;

            // Handle different content types
            if (req.file) {
                // File upload via multipart/form-data
                projectData = req.file.buffer;
            } else if (req.body.projectData) {
                // JSON payload with base64 or raw data
                if (typeof req.body.projectData === 'string') {
                    // Assume base64 encoded
                    projectData = Buffer.from(req.body.projectData, 'base64');
                } else {
                    projectData = Buffer.from(req.body.projectData);
                }
            } else if (Buffer.isBuffer(req.body)) {
                // Raw binary data
                projectData = req.body;
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'No project data provided'
                });
            }

            const result = await storage.saveProject(projectData, projectId);
            
            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Error in saveProject:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Load a project (GET /api/projects/:projectId)
    static async loadProject(req, res) {
        try {
            const projectId = req.params.projectId;
            const result = await storage.loadProject(projectId);
            
            if (result.success) {
                // Set appropriate headers for .sb3 file download
                res.setHeader('Content-Type', 'application/octet-stream');
                res.setHeader('Content-Disposition', `attachment; filename="${projectId}.sb3"`);
                res.setHeader('Content-Length', result.size);
                res.send(result.data);
            } else {
                res.status(404).json(result);
            }
        } catch (error) {
            console.error('Error in loadProject:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get project info (GET /api/projects/:projectId/info)
    static async getProjectInfo(req, res) {
        try {
            const projectId = req.params.projectId;
            const result = await storage.loadProject(projectId);
            
            if (result.success) {
                res.json({
                    success: true,
                    projectId: result.projectId,
                    size: result.size,
                    exists: true
                });
            } else {
                res.status(404).json(result);
            }
        } catch (error) {
            console.error('Error in getProjectInfo:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // List all projects (GET /api/projects)
    static async listProjects(req, res) {
        try {
            const result = await storage.listProjects();
            res.json(result);
        } catch (error) {
            console.error('Error in listProjects:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Delete a project (DELETE /api/projects/:projectId)
    static async deleteProject(req, res) {
        try {
            const projectId = req.params.projectId;
            const result = await storage.deleteProject(projectId);
            
            if (result.success) {
                res.json(result);
            } else {
                res.status(404).json(result);
            }
        } catch (error) {
            console.error('Error in deleteProject:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get storage info (GET /api/storage/info)
    static getStorageInfo(req, res) {
        try {
            const info = storage.getStorageInfo();
            res.json({
                success: true,
                storage: info
            });
        } catch (error) {
            console.error('Error in getStorageInfo:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Upload middleware
    static getUploadMiddleware() {
        return upload.single('project');
    }
}

module.exports = ProjectAPI;