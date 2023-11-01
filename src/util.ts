export const cacheFunction = async (func: Function, ...params: any[]) => {
  const fileName = `${func.name}_${JSON.stringify(params)}`;
  const cacheKey = `cache_${fileName}`;
  let cachedData = null;

  if (typeof window !== 'undefined') {
    // Running in the browser
    cachedData = localStorage.getItem(cacheKey);
  } else {
    // Running in Node.js
    const fs = require('fs');
    const filePath = "./cache/" + fileName + ".json";
    if (!fs.existsSync("./cache")) {
      fs.mkdirSync("./cache");
    }
    if (fs.existsSync(filePath)) {
      console.log(`Loading data from cache file: ${filePath}`);
      const data = fs.readFileSync(filePath, 'utf-8');
      cachedData = JSON.parse(data);
    }
  }

  if (cachedData !== null) {
    console.log(`Loading data from cache: ${cacheKey}`);
    return cachedData;
  } else {
    console.log(`Cache not found. Executing function and caching data to cache: ${cacheKey}`);
    const result = await func(...params);
    if (typeof window !== 'undefined') {
      // Running in the browser
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } else {
      // Running in Node.js
      const fs = require('fs');
      const filePath = "./cache/" + fileName + ".json";
      fs.writeFileSync(filePath, JSON.stringify(result));
    }
    return result;
  }
}

export const loadJsonFromUrl = async (url: string, params: any): Promise<any> => {
  var headers = { "accept": "application/ld+json" };
  const paramsBuilder = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      paramsBuilder.set(key, value.toString())
    } else {
      throw new Error("Invalid parameter")
    }
  }
  if (params !== undefined && !url.endsWith('?')) {
    url += '?';
  }

  let response = await fetch(url + paramsBuilder.toString(), { headers: headers })

  if (!response.ok) {
    throw new Error("HTTP error " + response.status+ " for url: " + url + paramsBuilder.toString());
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Tried to query: " + response.url + " But got and invalid JSON:" + text.substring(0, 100) + "...");
  }
}
