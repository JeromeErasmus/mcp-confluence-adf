import { join, resolve, basename } from 'path';
import { homedir } from 'os';
import * as fs from 'fs-extra';
import { existsSync } from 'fs';
import { ManagedFile, FileManagerConfig } from "../types/index.js";

export class FileManager {
  private static config: FileManagerConfig = {};
  
  // Set configuration
  static setConfig(config: FileManagerConfig): void {
    this.config = config;
  }
  
  // Get base directory using priority order
  private static getBaseDirectory(): string {
    // Priority 1: Current working directory + confluence-downloads
    const cwdPath = join(process.cwd(), 'confluence-downloads');
    if (existsSync(cwdPath) || !this.config.baseDirectory) {
      // Create if doesn't exist, or use as default
      fs.ensureDirSync(cwdPath);
      return cwdPath;
    }
    
    // Priority 2: User-configured directory
    if (this.config.baseDirectory) {
      return resolve(this.config.baseDirectory);
    }
    
    // Priority 3: Home directory + confluence-downloads
    const homePath = join(homedir(), 'confluence-downloads');
    fs.ensureDirSync(homePath);
    return homePath;
  }
  
  // Create managed file with page ID prefix
  static async createManagedFile(pageId: string, title: string, targetDir?: string): Promise<ManagedFile> {
    const baseDir = targetDir || this.getBaseDirectory();
    await fs.ensureDir(baseDir);
    
    // Create safe filename with page ID prefix
    const safeTitle = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const filename = `${pageId}-${safeTitle}`;
    const markdownPath = join(baseDir, `${filename}.md`);
    const metadataPath = join(baseDir, `${filename}.meta.json`);
    
    return {
      filePath: markdownPath,
      metadataPath: metadataPath
    };
  }
  
  // Extract page ID from filename
  static extractPageIdFromFilename(filePath: string): string | null {
    const filename = basename(filePath);
    const match = filename.match(/^(\d+)-/);
    return match ? match[1] : null;
  }
  
  // Get display-friendly path
  static getDisplayPath(fullPath: string): string {
    const baseDir = this.getBaseDirectory();
    if (fullPath.startsWith(baseDir)) {
      return fullPath.replace(baseDir, 'confluence-downloads');
    }
    return fullPath;
  }
}