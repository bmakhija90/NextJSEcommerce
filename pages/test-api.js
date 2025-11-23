import { useEffect, useState } from 'react';

export default function TestAPI() {
  const [status, setStatus] = useState('Testing...');

  useEffect(() => {
    testAPIs();
  }, []);

  const testAPIs = async () => {
    try {
      const tests = [
        { name: 'Products API', url: '/api/products' },
        { name: 'Categories API', url: '/api/products/categories' },
      ];

      for (const test of tests) {
        const response = await fetch(test.url);
        setStatus(`${test.name}: ${response.status} ${response.statusText}`);
        if (!response.ok) {
          throw new Error(`${test.name} failed: ${response.status}`);
        }
      }
      setStatus('All APIs working correctly!');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>API Test</h1>
      <pre>{status}</pre>
    </div>
  );
}