const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ProjectStorage {
    constructor(storageDir = '/app/projects') {
        this.storageDir = storageDir;
        this.ensureStorageDir();
    }

    ensureStorageDir() {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
            console.log(`Created projects storage directory: ${this.storageDir}`);
        }
    }

    generateProjectId() {
        return crypto.randomBytes(16).toString('hex');
    }

    getProjectPath(projectId) {
        return path.join(this.storageDir, `${projectId}.sb3`);
    }

    async saveProject(projectData, projectId = null) {
        try {
            const id = projectId || this.generateProjectId();
            const filePath = this.getProjectPath(id);
            
            // Ensure projectData is a Buffer
            const buffer = Buffer.isBuffer(projectData) ? projectData : Buffer.from(projectData);
            
            await fs.promises.writeFile(filePath, buffer);
            
            console.log(`Project saved: ${id} (${buffer.length} bytes)`);
            return {
                success: true,
                projectId: id,
                filePath: filePath,
                size: buffer.length
            };
        } catch (error) {
            console.error('Error saving project:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async loadProject(projectId) {
        try {
            const filePath = this.getProjectPath(projectId);
            
            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: 'Project not found'
                };
            }

            const projectData = await fs.promises.readFile(filePath);
            
            console.log(`Project loaded: ${projectId} (${projectData.length} bytes)`);
            return {
                success: true,
                projectId: projectId,
                data: projectData,
                size: projectData.length
            };
        } catch (error) {
            console.error('Error loading project:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async listProjects() {
        try {
            const files = await fs.promises.readdir(this.storageDir);
            const projects = files
                .filter(file => file.endsWith('.sb3'))
                .map(file => {
                    const projectId = path.basename(file, '.sb3');
                    const filePath = path.join(this.storageDir, file);
                    const stats = fs.statSync(filePath);
                    
                    return {
                        projectId: projectId,
                        filename: file,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
                .sort((a, b) => b.modified - a.modified); // Sort by most recent first

            return {
                success: true,
                projects: projects,
                count: projects.length
            };
        } catch (error) {
            console.error('Error listing projects:', error);
            return {
                success: false,
                error: error.message,
                projects: [],
                count: 0
            };
        }
    }

    async deleteProject(projectId) {
        try {
            const filePath = this.getProjectPath(projectId);
            
            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: 'Project not found'
                };
            }

            await fs.promises.unlink(filePath);
            
            console.log(`Project deleted: ${projectId}`);
            return {
                success: true,
                projectId: projectId
            };
        } catch (error) {
            console.error('Error deleting project:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getStorageInfo() {
        try {
            const stats = fs.statSync(this.storageDir);
            return {
                storageDir: this.storageDir,
                exists: true,
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            return {
                storageDir: this.storageDir,
                exists: false,
                error: error.message
            };
        }
    }
}

module.exports = ProjectStorage;