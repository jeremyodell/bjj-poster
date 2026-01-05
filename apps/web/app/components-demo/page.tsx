'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps): React.ReactElement {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl text-white">{title}</h2>
      <div className="rounded-lg border border-border bg-card p-6">{children}</div>
    </section>
  );
}

export default function ComponentsDemo() {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2">
            <h1 className="font-display text-4xl text-white">Component Library</h1>
            <p className="font-body text-muted-foreground">
              shadcn/ui components styled with BJJ Poster design system
            </p>
          </div>

          {/* Buttons */}
          <Section title="Button">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </Section>

          {/* Badge */}
          <Section title="Badge">
            <div className="flex flex-wrap gap-4">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </Section>

          {/* Card */}
          <Section title="Card">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Entry</CardTitle>
                  <CardDescription>Create your competition poster</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Build professional tournament posters with your athlete information and
                    competition details.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button>Get Started</Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Posters</CardTitle>
                  <CardDescription>Your saved designs</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View and manage your previously created tournament posters.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="secondary">View All</Button>
                </CardFooter>
              </Card>
            </div>
          </Section>

          {/* Input */}
          <Section title="Input">
            <div className="space-y-4">
              <Input placeholder="Enter athlete name..." />
              <div className="space-y-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Controlled input - type to see value below"
                />
                {inputValue && <p className="text-sm text-muted-foreground">Value: {inputValue}</p>}
              </div>
              <Input disabled placeholder="Disabled input" />
            </div>
          </Section>

          {/* Textarea */}
          <Section title="Textarea">
            <div className="space-y-4">
              <Textarea placeholder="Enter tournament description..." />
              <div className="space-y-2">
                <Textarea
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                  placeholder="Controlled textarea - type to see value below"
                />
                {textareaValue && (
                  <p className="text-sm text-muted-foreground">Value: {textareaValue}</p>
                )}
              </div>
            </div>
          </Section>

          {/* Select */}
          <Section title="Select">
            <div className="space-y-4">
              <Select>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select weight class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rooster">Rooster (57.5kg)</SelectItem>
                  <SelectItem value="light-feather">Light Feather (64kg)</SelectItem>
                  <SelectItem value="feather">Feather (70kg)</SelectItem>
                  <SelectItem value="light">Light (76kg)</SelectItem>
                  <SelectItem value="middle">Middle (82.3kg)</SelectItem>
                  <SelectItem value="medium-heavy">Medium Heavy (88.3kg)</SelectItem>
                  <SelectItem value="heavy">Heavy (94.3kg)</SelectItem>
                  <SelectItem value="super-heavy">Super Heavy (100.5kg)</SelectItem>
                  <SelectItem value="ultra-heavy">Ultra Heavy (100.5kg+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          {/* Avatar */}
          <Section title="Avatar">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
            </div>
          </Section>

          {/* Dialog */}
          <Section title="Dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Poster</DialogTitle>
                  <DialogDescription>
                    Start creating your tournament poster. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input placeholder="Tournament name" />
                  <Input placeholder="Date" />
                </div>
                <DialogFooter>
                  <Button variant="secondary">Cancel</Button>
                  <Button>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Section>

          {/* Sheet */}
          <Section title="Sheet">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                  <SheetDescription>
                    Manage your poster preferences and account settings.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <Input placeholder="Display name" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Default belt color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="brown">Brown</SelectItem>
                      <SelectItem value="black">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SheetContent>
            </Sheet>
          </Section>

          {/* Dropdown Menu */}
          <Section title="Dropdown Menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Open Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Edit Poster</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Download</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Section>

          {/* Tooltip */}
          <Section title="Tooltip">
            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button>Save Poster</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save your current poster design</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </Section>
        </div>
      </main>
    </TooltipProvider>
  );
}
