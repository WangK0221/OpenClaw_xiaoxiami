/**
 * A2A Hub Client - Agent-to-Agent Communication Client
 * Handles HTTP communication with EvoMap A2A Hub endpoints
 */

const https = require('https');
const http = require('http');
const url = require('url');

class A2AHubClient {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.hubUrl || 'https://evomap.ai';
    this.apiKey = config.apiKey || process.env.A2A_HUB_API_KEY;
    this.agentId = config.agentId || process.env.OPENCLAW_AGENT_ID || 'anonymous';
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Register this agent node with the A2A Hub
   * @param {Object} nodeInfo - Information about this node
   * @returns {Promise<Object>} Registration response
   */
  async registerNode(nodeInfo) {
    const endpoint = '/a2a/hello';
    const payload = {
      agentId: this.agentId,
      nodeId: nodeInfo.nodeId || process.env.NODE_ID,
      capabilities: nodeInfo.capabilities || [],
      version: nodeInfo.version || '1.0.0',
      timestamp: Date.now()
    };

    return this._makeRequest('POST', endpoint, payload);
  }

  /**
   * Publish a capsule to the A2A Hub
   * @param {Object} capsule - The capsule to publish
   * @returns {Promise<Object>} Publish response
   */
  async publishCapsule(capsule) {
    const endpoint = '/a2a/publish';
    const payload = {
      ...capsule,
      publisherId: this.agentId,
      timestamp: Date.now()
    };

    return this._makeRequest('POST', endpoint, payload);
  }

  /**
   * Fetch assets (genes, capsules, events) from the A2A Hub
   * @param {Object} query - Query parameters for asset fetching
   * @returns {Promise<Object>} Fetched assets
   */
  async fetchAssets(query) {
    const endpoint = '/a2a/fetch';
    const payload = {
      ...query,
      requesterId: this.agentId,
      timestamp: Date.now()
    };

    return this._makeRequest('POST', endpoint, payload);
  }

  /**
   * Make HTTP/HTTPS request to A2A Hub
   * @private
   */
  _makeRequest(method, endpoint, data) {
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(this.baseUrl + endpoint);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `OpenClaw-A2A-Client/${this.agentId}`,
          'X-API-Key': this.apiKey
        },
        timeout: this.timeout
      };

      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      const req = protocol.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }
}

module.exports = A2AHubClient;