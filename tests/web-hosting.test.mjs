import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assetUrl,apiUrl} from '../lib/web-hosting.ts';
import {allowedStoryOrigin,storyPreflight,withStoryCors} from '../lib/story-cors.ts';

test('static assets stay under the repository path and server defaults stay at root',()=>{
 assert.equal(assetUrl('/images/scene-01.webp','/cisheng/'),'/cisheng/images/scene-01.webp');
 assert.equal(assetUrl('/data/countries.json','/cisheng/'),'/cisheng/data/countries.json');
 assert.equal(assetUrl('/images/scene-01.webp'),'/images/scene-01.webp');
 assert.equal(apiUrl('/api/stories','https://example.test'),'https://example.test/api/stories');
 assert.equal(apiUrl('/api/stories'),'/api/stories');
});
test('story writes accept only same origin or the exact owner Pages origin',()=>{
 const request=origin=>new Request('https://game.example/api/stories',{headers:origin?{Origin:origin}:{}});
 for(const origin of [undefined,'https://game.example','https://bankeluilian.github.io'])assert.equal(allowedStoryOrigin(request(origin)),true);
 for(const origin of ['null','https://evil.test','http://bankeluilian.github.io','https://bankeluilian.github.io.evil.test'])assert.equal(allowedStoryOrigin(request(origin)),false);
});
test('preflight and normal replies grant CORS only to the configured public Pages origin',()=>{
 const req=new Request('https://game.example/api/stories',{method:'OPTIONS',headers:{Origin:'https://bankeluilian.github.io','Access-Control-Request-Method':'POST'}});
 const preflight=storyPreflight(req);assert.equal(preflight.status,204);
 assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://bankeluilian.github.io');
 assert.match(preflight.headers.get('Access-Control-Allow-Methods'),/POST/);
 const response=withStoryCors(req,Response.json({stories:[]}));
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://bankeluilian.github.io');
 assert.equal(response.headers.has('Access-Control-Allow-Credentials'),false);
 const denied=new Request(req.url,{method:'OPTIONS',headers:{Origin:'https://evil.test'}});
 assert.equal(storyPreflight(denied).status,403);
 assert.equal(withStoryCors(denied,Response.json({})).headers.has('Access-Control-Allow-Origin'),false);
});
