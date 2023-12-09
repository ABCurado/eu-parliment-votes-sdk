
export const cacheFunction = async (func: Function, ...params: any[]) => {
  const fileName = `${func.name}_${JSON.stringify(params)}`;
  const cacheKey = `cache_${fileName}`;
  let cachedData = null;

  // Check if the cloudflare cache is enabled from the environment variable.
  // If it is enabled, we use s3 as the cache.
  if (process.env.CLOUDFLARE_CACHE_ENABLED === "true") {
    // Running in Cloudflare Workers
    const {S3Client, GetObjectCommand,PutObjectCommand} = require('@aws-sdk/client-s3');
    const S3 = new S3Client({
      region: "auto",
      endpoint: process.env.CLOUDFLARE_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY,
      },
    });
    
    try {
      const input = {
        "Bucket": "eu-parliment-sdk",
        "Key": cacheKey
      };
      const command = new GetObjectCommand(input);
      const response = await S3.send(command);
      const data = response.Body.toString('utf-8');
      cachedData = JSON.parse(data);
      console.log(`Loading data from cache: ${cacheKey}`);
      return cachedData;
    }
    catch (err) {
      console.log(`Cache not found. Executing function and caching data to cache: ${cacheKey}`);
      const result = await func(...params);
      const input = {
        "Bucket": "eu-parliment-sdk",
        "Key": cacheKey,
        "Body": JSON.stringify(result)
      };
      const command = new PutObjectCommand(input);
      try {
        const response = await S3.send(command);
      } catch (err) {
        console.log(err);
      }
      return result;
    }
  }

  if (typeof window !== 'undefined') {
    // Running in the browser
    cachedData = localStorage.getItem(cacheKey);
    if (cachedData !== null) {
      cachedData = JSON.parse(cachedData);
      console.log(`Loading data from cache: ${cacheKey}`);
      return cachedData;
    } else {
      console.log(`Cache not found. Executing function and caching data to cache: ${cacheKey}`);
      const result = await func(...params);
      localStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    }
  }

  if (typeof window === 'undefined') {
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
      return cachedData;
    } else {
      // Running in Node.js
      const fs = require('fs');
      const filePath = "./cache/" + fileName + ".json";
      const result = await func(...params);
      console.log(`Cache not found. Executing function and caching data to cache file: ${filePath}`);
      fs.writeFileSync(filePath, JSON.stringify(result));
    }
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
    throw new Error("HTTP error " + response.status + " for url: " + url + paramsBuilder.toString());
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Tried to query: " + url + " But got and invalid JSON:" + text.substring(0, 100));
  }
}

export const checkNameIsInList = (fullName: string, nameList: string[]): boolean => {
  // Normalize the fullName to remove accents and put in lower case
  const normalizeFullName = fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // Split the full name into individual names
  const names = normalizeFullName.split(' ');
  // Normalize the nameList to remove accents and put in lower case
  const normalizeNameList = nameList.map(name => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());

  // Check if any of the names are in the list
  for (const name of names) {
    if (normalizeNameList.includes(name)) {
      return true;
    }
  }

  return false;
}
