import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaRocket, FaCode, FaBook } from "react-icons/fa";

export default function Home() {
  return (
    // home
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">
              Welcome to Inter CRM Admin
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A modern admin dashboard built with Next.js, shadcn/ui, TanStack libraries, and more
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FaRocket className="text-3xl text-blue-500 mb-2" />
                <CardTitle>View Examples</CardTitle>
                <CardDescription>
                  Explore all the technologies and components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/examples">
                  <Button className="w-full">Browse Examples</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FaCode className="text-3xl text-green-500 mb-2" />
                <CardTitle>Tech Stack</CardTitle>
                <CardDescription>
                  Next.js, shadcn/ui, TanStack, Leaflet, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/examples">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FaBook className="text-3xl text-purple-500 mb-2" />
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Check out the setup and configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/examples">
                  <Button variant="outline" className="w-full">Read Docs</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Features List */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Installed Technologies</CardTitle>
              <CardDescription>
                Everything you need to build a modern admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Core Framework</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Next.js 16 with App Router</li>
                    <li>✓ React 19</li>
                    <li>✓ TypeScript</li>
                    <li>✓ Tailwind CSS v4</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">UI Components</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ shadcn/ui Components</li>
                    <li>✓ React Icons</li>
                    <li>✓ Leaflet Maps</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Data Management</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ TanStack Query</li>
                    <li>✓ TanStack Table</li>
                    <li>✓ TanStack Form</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Utilities</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Axios Instance</li>
                    <li>✓ Winston Logger</li>
                    <li>✓ React Query DevTools</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
