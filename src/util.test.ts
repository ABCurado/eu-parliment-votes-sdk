import { cacheFunction } from './util';
import { checkNameIsInList } from './util';
import { loadJsonFromUrl } from './util';

describe('cacheFunction', () => {
    it('should cache the result of a function', async () => {
        const func = (a: number, b: number) => a + b;
        const result = await cacheFunction(func, 2, 3);
        expect(result).toEqual(5);
    });

    it('should return the cached result of a function', async () => {
        const func = (a: number, b: number) => a + b;
        const result1 = await cacheFunction(func, 2, 3);
        const result2 = await cacheFunction(func, 2, 3);
        expect(result1).toEqual(result2);
    });

    it('should cache the result of a function with different parameters', async () => {
        const func = (a: number, b: number) => a + b;
        const result1 = await cacheFunction(func, 2, 3);
        const result2 = await cacheFunction(func, 4, 5);
        expect(result1).not.toEqual(result2);
    });
});

describe('checkNameIsInList', () => {
    it('should return true if the name is in the list', () => {
        const fullName = 'John Doe';
        const nameList = ['john', 'jane', 'doe'];
        const result = checkNameIsInList(fullName, nameList);
        expect(result).toBe(true);
    });

    it('should return false if the name is not in the list', () => {
        const fullName = 'Donna Smith';
        const nameList = ['john', 'jane', 'doe'];
        const result = checkNameIsInList(fullName, nameList);
        expect(result).toBe(false);
    });

    it('should return true if any of the names are in the list', () => {
        const fullName = 'John Jane Doe';
        const nameList = ['john', 'jane', 'doe'];
        const result = checkNameIsInList(fullName, nameList);
        expect(result).toBe(true);
    });

    it('should return false if none of the names are in the list', () => {
        const fullName = 'Johnz Smithz';
        const nameList = ['john', 'jane', 'doe'];
        const result = checkNameIsInList(fullName, nameList);
        expect(result).toBe(false);
    });
});

describe('loadJsonFromUrl', () => {
    it('should load JSON from a URL', async () => {
        const url = 'https://jsonplaceholder.typicode.com/todos/1';
        const params = {};
        const result = await loadJsonFromUrl(url, params);
        expect(result.userId).toEqual(1);
        expect(result.id).toEqual(1);
        expect(result.title).toEqual('delectus aut autem');
        expect(result.completed).toEqual(false);
    });

    it('should throw an error for an invalid URL', async () => {
        const url = 'https://jsonplaceholder.typicode.com/invalid';
        const params = {};
        await expect(loadJsonFromUrl(url, params)).rejects.toThrowError('HTTP error 404 for url: https://jsonplaceholder.typicode.com/invalid');
    });

    it('should throw an error for an invalid parameter', async () => {
        const url = 'https://jsonplaceholder.typicode.com/todos';
        const params = { userId: undefined };
        await expect(loadJsonFromUrl(url, params)).rejects.toThrowError('Invalid parameter');
    });

    it('should throw an error for an invalid JSON response', async () => {
        const url = 'https://jsonplaceholder.typicode.com/todos/1';
        const params = {};
        const response = await fetch(url + '?' + new URLSearchParams(params).toString());
        const text = await response.text();
        const invalidJson = text.substring(0, 100) + '...';
        jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(new Response(invalidJson, { status: 200, headers: { 'Content-type': 'application/json' } })));
        await expect(loadJsonFromUrl(url, params)).rejects.toThrowError(`Tried to query: ${url}? But got and invalid JSON:${invalidJson}`);
    });
});