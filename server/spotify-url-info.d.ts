declare module 'spotify-url-info' {
  function spotifyUrlInfo(fetchFn: typeof fetch): (url: string) => Promise<any>;
  export default spotifyUrlInfo;
}
