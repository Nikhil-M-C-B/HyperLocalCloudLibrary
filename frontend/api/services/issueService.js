import api from '../axiosInstance';

/**
 * Issue Service
 * Handles issue lifecycle: fetching user issues and issue details.
 * Maps to the Issues entity in DB V1.
 */
const issueService = {
    /**
     * Get all issues for a profile.
     * @param {string} profileId
     */
    getUserIssues: async (profileId) => {
        const response = await api.get('/issues', { params: { profileId } });
        return response.data;
    },

    /**
     * Get full details for a specific issue.
     * @param {string} issueId
     */
    getIssueDetails: async (issueId) => {
        const response = await api.get(`/issues/${issueId}`);
        return response.data;
    },
};

export default issueService;
