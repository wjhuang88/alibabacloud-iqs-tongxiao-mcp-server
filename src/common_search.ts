import { McpError } from "@modelcontextprotocol/sdk/types.js";

function handleSearchError(api: string, status: number, errorData: any): never {
    let code: number;
    let message: string;
    
    switch (status) {
        case 404:
            message = "Specified access key is not found.";
            break;
        case 403:
            message = "Please activate AI search service";
            break;
        case 429:
            message = "Request was denied due to user flow control.";
            break;
        default:
            message = errorData || "Unknown Error";
    }

    throw new McpError(status, `${api} 搜索失败: ${message}`);
}

export const COMMON_SEARCH_TOOL = {
    name: "common_search",
    description: "标准搜索接口提供增强的网络开放域的实时搜索能力，通过大模型优化与多数据源融合的技术，查询干净、准确、多样、高质量的结果。",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "搜索问题（长度：>=2 and <=100）"
            }
        },
        required: ["query"]
    }
};

export async function handleCommonSearch(TONGXIAO_API_KEY: string, params: any) {
    const { query } = params
    const url = new URL("https://cloud-iqs.aliyuncs.com/search/llm");

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "X-API-Key": TONGXIAO_API_KEY
        },
        body: JSON.stringify({
            "query": query,
            "numResults": 5
        })
    });

    if (response.status != 200) {
        const errorData = await response.text();
        handleSearchError('common_search', response.status, errorData);
    }

    const data = await response.json();
    const pageItems = data.pageItems
    const pageResults: string[] = []
    for (let pageItem of pageItems) {
        let publishDate;
        if (pageItem.publishTime) {
            let date = new Date(pageItem.publishTime);
            publishDate = date.toISOString().split('T')[0];
        } else {
            publishDate = '';
        }

        const pageResult = `
标题：${pageItem.title || ''}
URL：${pageItem.link || ''}
站点名称：${pageItem.hostname || ''}
发布时间：${publishDate}
摘要：
${pageItem.summary || pageItem.snippet || ''}
        `.trim();
        pageResults.push(pageResult);
    }
    

    let markdown = `# 搜索结果\n`
    markdown += pageResults.join("\n\n---\n\n");

    return {
        content: [{
            type: "text",
            text: markdown
        }],
        isError: false
    };
}
