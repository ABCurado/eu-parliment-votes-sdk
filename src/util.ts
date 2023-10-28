import fs from 'fs';

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

export const cacheFunction = async (func: Function, ...params: any[]) => {
  const fileName = `${func.name}_${JSON.stringify(params)}`;
  var filePath = "./src/cache/" + fileName + ".json";
  if (fs.existsSync(filePath)) {
      console.log(`Loading data from cache file: ${filePath}`);
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
  } else {
      console.log(`Cache file not found. Executing function and caching data to file: ${filePath}`);
      const result = await func(...params);
      fs.writeFileSync(filePath, JSON.stringify(result));
      return result;
  }
}