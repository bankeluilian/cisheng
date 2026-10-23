export const PAGES_ORIGIN='https://bankeluilian.github.io';
export function allowedStoryOrigin(request:Request){const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin||origin===PAGES_ORIGIN;}
export function withStoryCors(request:Request,response:Response){
 if(request.headers.get('Origin')!==PAGES_ORIGIN)return response;
 const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',PAGES_ORIGIN);headers.append('Vary','Origin');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export function storyPreflight(request:Request){
 if(!allowedStoryOrigin(request))return Response.json({error:'请求来源不匹配'},{status:403});
 const headers=new Headers({'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'});
 return withStoryCors(request,new Response(null,{status:204,headers}));
}
