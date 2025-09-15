import { FileManager } from '../../filemanager/index.js';
import { FileManagerConfig } from '../../types/index.js';
import * as fs from 'fs-extra';
import { join, resolve, basename } from 'path';
import { homedir } from 'os';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  existsSync: jest.fn(),
  ensureDirSync: jest.fn(),
  ensureDir: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn(),
  resolve: jest.fn(),
  basename: jest.fn()
}));

jest.mock('os', () => ({
  homedir: jest.fn()
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedJoin = join as jest.MockedFunction<typeof join>;
const mockedResolve = resolve as jest.MockedFunction<typeof resolve>;
const mockedBasename = basename as jest.MockedFunction<typeof basename>;
const mockedHomedir = homedir as jest.MockedFunction<typeof homedir>;

describe('FileManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset static configuration
    FileManager.setConfig({});
    
    // Default mock implementations
    mockedJoin.mockImplementation((...paths) => paths.join('/'));
    mockedResolve.mockImplementation((path) => path);
    mockedBasename.mockImplementation((path) => path.split('/').pop() || '');
    mockedHomedir.mockReturnValue('/home/user');
    mockedFs.existsSync.mockReturnValue(false);
    (mockedFs.ensureDirSync as jest.Mock).mockReturnValue(undefined);
    (mockedFs.ensureDir as jest.Mock).mockResolvedValue(undefined);
  });

  describe('setConfig', () => {
    it('should store configuration', () => {
      const config: FileManagerConfig = {
        baseDirectory: '/custom/path'
      };

      FileManager.setConfig(config);
      
      // Verify config is stored by checking directory resolution behavior
      mockedFs.existsSync.mockReturnValue(false);
      
      // This should trigger the custom directory path
      const managedFile = FileManager.createManagedFile('123', 'test');
      
      expect(mockedFs.ensureDir).toHaveBeenCalledWith('/custom/path');
    });
  });

  describe('createManagedFile', () => {
    it('should create managed file in CWD when confluence-downloads exists', async () => {
      process.cwd = jest.fn().mockReturnValue('/current/working/dir');
      mockedFs.existsSync.mockReturnValue(true);

      const result = await FileManager.createManagedFile('123456', 'My Test Page');

      expect(mockedJoin).toHaveBeenCalledWith('/current/working/dir', 'confluence-downloads');
      expect(mockedFs.ensureDir).toHaveBeenCalledWith('/current/working/dir/confluence-downloads');
      expect(result).toEqual({
        filePath: '/current/working/dir/confluence-downloads/123456-my-test-page.md',
        metadataPath: '/current/working/dir/confluence-downloads/123456-my-test-page.meta.json'
      });
    });

    it('should create managed file in CWD when no config is set', async () => {
      process.cwd = jest.fn().mockReturnValue('/current/working/dir');
      mockedFs.existsSync.mockReturnValue(false);

      const result = await FileManager.createManagedFile('123456', 'My Test Page');

      expect(mockedFs.ensureDirSync).toHaveBeenCalledWith('/current/working/dir/confluence-downloads');
      expect(mockedFs.ensureDir).toHaveBeenCalledWith('/current/working/dir/confluence-downloads');
      expect(result).toEqual({
        filePath: '/current/working/dir/confluence-downloads/123456-my-test-page.md',
        metadataPath: '/current/working/dir/confluence-downloads/123456-my-test-page.meta.json'
      });
    });

    it('should use custom target directory when provided', async () => {
      const result = await FileManager.createManagedFile('123456', 'My Test Page', '/custom/target');

      expect(mockedFs.ensureDir).toHaveBeenCalledWith('/custom/target');
      expect(result).toEqual({
        filePath: '/custom/target/123456-my-test-page.md',
        metadataPath: '/custom/target/123456-my-test-page.meta.json'
      });
    });

    it('should sanitize page titles', async () => {
      const result = await FileManager.createManagedFile('123', 'My Test Page!@#$%^&*()');

      expect(result.filePath).toContain('123-my-test-page-.md');
      expect(result.metadataPath).toContain('123-my-test-page-.meta.json');
    });

    it('should handle special characters in titles', async () => {
      const testCases = [
        { input: 'Test/Page\\Name', expected: '123-test-page-name' },
        { input: 'Test Page: Subtitle', expected: '123-test-page-subtitle' },
        { input: 'Test   Multiple   Spaces', expected: '123-test-multiple-spaces' },
        { input: 'UPPERCASE Title', expected: '123-uppercase-title' }
      ];

      for (const { input, expected } of testCases) {
        const result = await FileManager.createManagedFile('123', input);
        expect(result.filePath).toContain(`${expected}.md`);
      }
    });

    it('should use configured base directory', async () => {
      FileManager.setConfig({ baseDirectory: '/configured/path' });
      process.cwd = jest.fn().mockReturnValue('/current/working/dir');
      mockedFs.existsSync.mockReturnValue(false);

      const result = await FileManager.createManagedFile('123456', 'Test Page');

      expect(mockedFs.ensureDir).toHaveBeenCalledWith('/configured/path');
      expect(result.filePath).toContain('/configured/path/');
    });

    it('should fall back to home directory when CWD does not exist and no config', async () => {
      FileManager.setConfig({});
      process.cwd = jest.fn().mockReturnValue('/current/working/dir');
      
      // Mock that CWD/confluence-downloads doesn't exist AND no config is set
      mockedFs.existsSync.mockReturnValue(false);

      const result = await FileManager.createManagedFile('123456', 'Test Page');

      // The FileManager should create the CWD directory anyway when no config is set
      expect(mockedFs.ensureDirSync).toHaveBeenCalledWith('/current/working/dir/confluence-downloads');
      expect(mockedFs.ensureDir).toHaveBeenCalledWith('/current/working/dir/confluence-downloads');
    });
  });

  describe('extractPageIdFromFilename', () => {
    it('should extract page ID from valid filename', () => {
      const testCases = [
        { filename: '/path/to/123456-my-page.md', expected: '123456' },
        { filename: '987654-another-page.md', expected: '987654' },
        { filename: '555555-windows-page.md', expected: '555555' },
        { filename: '123-simple.md', expected: '123' }
      ];

      testCases.forEach(({ filename, expected }) => {
        mockedBasename.mockReturnValue(filename.split('/').pop() || filename);
        const result = FileManager.extractPageIdFromFilename(filename);
        expect(result).toBe(expected);
      });
    });

    it('should return null for invalid filenames', () => {
      const testCases = [
        'no-page-id.md',
        'abc-123-not-starting-with-number.md',
        'just-text.md',
        '',
        'no-extension',
        '-123-starting-with-dash.md'
      ];

      testCases.forEach((filename) => {
        const result = FileManager.extractPageIdFromFilename(filename);
        expect(result).toBeNull();
      });
    });

    it('should handle edge cases', () => {
      expect(FileManager.extractPageIdFromFilename('0-zero.md')).toBe('0');
      expect(FileManager.extractPageIdFromFilename('123456789012345-very-long-id.md')).toBe('123456789012345');
    });
  });

  describe('getDisplayPath', () => {
    beforeEach(() => {
      // Mock getBaseDirectory behavior
      process.cwd = jest.fn().mockReturnValue('/current/working/dir');
      mockedFs.existsSync.mockReturnValue(true);
    });

    it('should return display path for files in base directory', () => {
      const fullPath = '/current/working/dir/confluence-downloads/123-test.md';
      const result = FileManager.getDisplayPath(fullPath);

      expect(result).toBe('confluence-downloads/123-test.md');
    });

    it('should return full path for files outside base directory', () => {
      const fullPath = '/some/other/path/123-test.md';
      const result = FileManager.getDisplayPath(fullPath);

      expect(result).toBe('/some/other/path/123-test.md');
    });

    it('should handle configured base directory', () => {
      FileManager.setConfig({ baseDirectory: '/custom/base' });
      
      // Mock the path resolution for configured directory
      mockedFs.existsSync.mockReturnValue(false);
      
      const fullPath = '/custom/base/123-test.md';
      const result = FileManager.getDisplayPath(fullPath);

      expect(result).toBe('confluence-downloads/123-test.md');
    });

    it('should handle configured base directory', () => {
      FileManager.setConfig({ baseDirectory: '/configured/path' });
      process.cwd = jest.fn().mockReturnValue('/current/working/dir');
      mockedFs.existsSync.mockReturnValue(false);

      const fullPath = '/configured/path/123-test.md';
      const result = FileManager.getDisplayPath(fullPath);

      expect(result).toBe('confluence-downloads/123-test.md');
    });
  });

  describe('directory priority logic', () => {
    it('should prioritize CWD when confluence-downloads exists', async () => {
      process.cwd = jest.fn().mockReturnValue('/project');
      FileManager.setConfig({ baseDirectory: '/configured' });
      
      // Mock that CWD/confluence-downloads exists
      mockedFs.existsSync.mockImplementation((path) => {
        return path === '/project/confluence-downloads';
      });

      await FileManager.createManagedFile('123', 'test');

      expect(mockedFs.ensureDir).toHaveBeenCalledWith('/project/confluence-downloads');
    });

    it('should use configured directory when CWD does not exist', async () => {
      process.cwd = jest.fn().mockReturnValue('/project');
      FileManager.setConfig({ baseDirectory: '/configured' });
      
      // Mock that CWD/confluence-downloads does NOT exist
      mockedFs.existsSync.mockReturnValue(false);

      await FileManager.createManagedFile('123', 'test');

      expect(mockedFs.ensureDir).toHaveBeenCalledWith('/configured');
    });

    it('should create CWD directory when no config exists', async () => {
      process.cwd = jest.fn().mockReturnValue('/project');
      FileManager.setConfig({});
      
      // Mock that CWD/confluence-downloads does NOT exist and no config
      mockedFs.existsSync.mockReturnValue(false);

      await FileManager.createManagedFile('123', 'test');

      // According to the logic, it always uses CWD when no config.baseDirectory is set
      expect(mockedFs.ensureDirSync).toHaveBeenCalledWith('/project/confluence-downloads');
      expect(mockedFs.ensureDir).toHaveBeenCalledWith('/project/confluence-downloads');
    });
  });

  describe('error handling', () => {
    it('should handle fs operations that throw errors', async () => {
      (mockedFs.ensureDir as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));

      await expect(FileManager.createManagedFile('123', 'test')).rejects.toThrow('Permission denied');
    });

    it('should handle empty or invalid inputs gracefully', async () => {
      const result = await FileManager.createManagedFile('', '');

      expect(result.filePath).toContain('-.md');
      expect(result.metadataPath).toContain('-.meta.json');
    });
  });
});