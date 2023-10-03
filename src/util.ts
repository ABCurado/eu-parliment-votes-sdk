
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
    throw new Error("HTTP error " + response.status);
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Tried to query: " + response.url + " But got and invalid JSON:" + text.substring(0, 100) + "...");
  }
}
