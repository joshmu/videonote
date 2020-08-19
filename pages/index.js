import Head from "next/head";
import Layout from "../src/components/Layout";

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>Next.js Tailwind CSS Starter</title>
      </Head>
      <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
        Next.js Tailwind CSS Starter
      </h1>
    </Layout>
  );
}
