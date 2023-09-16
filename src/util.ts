export const loadJsonFromUrl = async (url: string, params: Object | undefined): Promise<any> => {
  var options = {
    method: 'GET',
    params: JSON.stringify(params) ,
    headers: { "accept": "application/ld+json" }
  };
  let response = await fetch(url)
  return await response.json();
}
