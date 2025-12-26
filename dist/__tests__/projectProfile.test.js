import { projectProfileTool } from '../tools/projectProfile.js';
import * as profileStorage from '../core/profileStorage.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
let testDir;
beforeAll(async () => {
    testDir = path.join(os.tmpdir(), `vibe-coding-profile-test-${Date.now()}`);
    await profileStorage.initializeProfileStorage(testDir);
});
afterAll(async () => {
    try {
        const files = await fs.readdir(testDir);
        for (const file of files) {
            await fs.unlink(path.join(testDir, file));
        }
        await fs.rmdir(testDir);
    }
    catch {
        // Ignore cleanup errors
    }
});
describe('projectProfileTool', () => {
    let createdProfileId;
    describe('create action', () => {
        it('should create a new profile', async () => {
            const result = await projectProfileTool({
                action: 'create',
                name: 'Test Project',
                description: 'A test project profile',
                projectPath: '/path/to/project',
                repository: 'https://github.com/test/repo',
                version: '1.0.0',
                publishing: {
                    defaultPlatform: 'notion',
                    autoPublish: false
                },
                codeAnalysis: {
                    defaultLanguage: 'typescript',
                    defaultDiagramTypes: ['class', 'flowchart'],
                    useAI: true
                },
                documentation: {
                    defaultDocType: 'README',
                    language: 'en',
                    author: 'Test Author'
                },
                defaultTags: ['project', 'test']
            });
            expect(result.success).toBe(true);
            expect(result.action).toBe('create');
            expect(result.profile).toBeDefined();
            expect(result.profile?.name).toBe('Test Project');
            expect(result.profile?.publishing?.defaultPlatform).toBe('notion');
            createdProfileId = result.profile.id;
        });
        it('should fail without name', async () => {
            const result = await projectProfileTool({
                action: 'create'
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('name');
        });
    });
    describe('get action', () => {
        it('should retrieve profile by ID', async () => {
            const result = await projectProfileTool({
                action: 'get',
                profileId: createdProfileId
            });
            expect(result.success).toBe(true);
            expect(result.profile?.name).toBe('Test Project');
        });
        it('should retrieve profile by name', async () => {
            const result = await projectProfileTool({
                action: 'get',
                name: 'Test Project'
            });
            expect(result.success).toBe(true);
            expect(result.profile?.id).toBe(createdProfileId);
        });
        it('should fail for non-existent profile', async () => {
            const result = await projectProfileTool({
                action: 'get',
                profileId: 'non-existent'
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });
    describe('update action', () => {
        it('should update profile settings', async () => {
            const result = await projectProfileTool({
                action: 'update',
                profileId: createdProfileId,
                version: '2.0.0',
                documentation: {
                    language: 'ko',
                    includeTableOfContents: true
                }
            });
            expect(result.success).toBe(true);
            expect(result.profile?.version).toBe('2.0.0');
            expect(result.profile?.documentation?.language).toBe('ko');
        });
    });
    describe('list action', () => {
        beforeAll(async () => {
            await projectProfileTool({
                action: 'create',
                name: 'Second Project',
                description: 'Another project'
            });
        });
        it('should list all profiles', async () => {
            const result = await projectProfileTool({
                action: 'list'
            });
            expect(result.success).toBe(true);
            expect(result.profiles?.length).toBeGreaterThanOrEqual(2);
            expect(result.total).toBeGreaterThanOrEqual(2);
        });
        it('should support pagination', async () => {
            const result = await projectProfileTool({
                action: 'list',
                limit: 1,
                offset: 0
            });
            expect(result.success).toBe(true);
            expect(result.profiles?.length).toBe(1);
        });
        it('should support sorting', async () => {
            const result = await projectProfileTool({
                action: 'list',
                sortBy: 'name',
                sortOrder: 'asc'
            });
            expect(result.success).toBe(true);
        });
    });
    describe('setActive and getActive actions', () => {
        it('should set active profile', async () => {
            const result = await projectProfileTool({
                action: 'setActive',
                profileId: createdProfileId
            });
            expect(result.success).toBe(true);
        });
        it('should get active profile', async () => {
            const result = await projectProfileTool({
                action: 'getActive'
            });
            expect(result.success).toBe(true);
            expect(result.profile?.id).toBe(createdProfileId);
        });
        it('should clear active profile', async () => {
            await projectProfileTool({
                action: 'setActive',
                profileId: undefined
            });
            const result = await projectProfileTool({
                action: 'getActive'
            });
            expect(result.success).toBe(true);
            expect(result.profile).toBeUndefined();
        });
    });
    describe('clone action', () => {
        it('should clone a profile', async () => {
            const result = await projectProfileTool({
                action: 'clone',
                profileId: createdProfileId,
                newName: 'Cloned Project'
            });
            expect(result.success).toBe(true);
            expect(result.profile?.name).toBe('Cloned Project');
            expect(result.profile?.id).not.toBe(createdProfileId);
        });
        it('should fail without newName', async () => {
            const result = await projectProfileTool({
                action: 'clone',
                profileId: createdProfileId
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('newName');
        });
    });
    describe('delete action', () => {
        it('should delete a profile', async () => {
            // 삭제할 프로파일 생성
            const createResult = await projectProfileTool({
                action: 'create',
                name: 'To Delete'
            });
            const deleteResult = await projectProfileTool({
                action: 'delete',
                profileId: createResult.profile.id
            });
            expect(deleteResult.success).toBe(true);
            // 삭제 확인
            const getResult = await projectProfileTool({
                action: 'get',
                profileId: createResult.profile.id
            });
            expect(getResult.success).toBe(false);
        });
        it('should fail for non-existent profile', async () => {
            const result = await projectProfileTool({
                action: 'delete',
                profileId: 'non-existent'
            });
            expect(result.success).toBe(false);
        });
    });
});
//# sourceMappingURL=projectProfile.test.js.map