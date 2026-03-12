import axios from 'axios';

// URL of your FlareSolverr instance on Render
const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || 'https://flaresolverr-xxxx.onrender.com';

interface FlareSolverrResponse {
  solution: {
    url: string;
    status: number;
    response: string;
    cookies: Array<{ name: string; value: string }>;
    userAgent: string;
  };
}

// Ask FlareSolverr to fetch a URL — it solves CF and returns HTML + cookies
export async function fetchWithCF(url: string): Promise<string> {
  const res = await axios.post<FlareSolverrResponse>(
    `${FLARESOLVERR_URL}/v1`,
    {
      cmd: 'request.get',
      url: url,
      maxTimeout: 20000, // PERF: was 60000ms
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.data?.solution?.response) {
    return res.data.solution.response;
  }
  throw new Error('FlareSolverr returned no response');
}