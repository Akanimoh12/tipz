import { useState } from 'react';
import { Heart, Search, User as UserIcon } from 'lucide-react';
import { Avatar, Badge, Button, Icon, Input, Skeleton, Spinner } from '@/components/atoms';
import { cn } from '@/utils/cn';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-secondary p-lg">
      <div className="max-w-7xl mx-auto space-y-xl">
        <section className="space-y-md">
          <h1 className="text-h1">Tipz Atomic Components</h1>
          <p className="text-body-lg">
            Brutalist design system with atomic components - buttons, inputs, avatars, badges, and more.
          </p>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Buttons</h2>
          <div className="space-y-sm">
            <div className="flex flex-wrap gap-sm">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex flex-wrap gap-sm">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap gap-sm">
              <Button variant="primary" disabled>Disabled</Button>
              <Button
                variant="secondary"
                isLoading={isLoading}
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 2000);
                }}
              >
                {isLoading ? 'Loading...' : 'Click to Load'}
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Inputs</h2>
          <div className="max-w-md space-y-sm">
            <Input label="Text Input" placeholder="Enter text..." />
            <Input label="With Error" error="This field is required" placeholder="Error state" />
            <Input type="search" placeholder="Search..." />
            <Input type="number" placeholder="Enter number..." />
            <Input label="Disabled Input" disabled value="Cannot edit" />
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Icons</h2>
          <div className="flex flex-wrap items-center gap-md">
            <Icon icon={Heart} size="xs" />
            <Icon icon={Heart} size="sm" />
            <Icon icon={Heart} size="md" />
            <Icon icon={Heart} size="lg" />
            <Icon icon={Heart} size="xl" />
            <Icon icon={Search} size="md" className="text-red-600" />
            <Icon icon={UserIcon} size="md" aria-label="User profile" />
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Badges</h2>
          <div className="space-y-sm">
            <div className="flex flex-wrap gap-sm">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="flex flex-wrap gap-sm">
              <Badge variant="success" size="sm">Small</Badge>
              <Badge variant="success" size="md">Medium</Badge>
            </div>
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Avatars</h2>
          <div className="space-y-sm">
            <div className="flex flex-wrap items-center gap-sm">
              <Avatar
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="User avatar"
                size="sm"
              />
              <Avatar
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
                alt="User avatar"
                size="md"
              />
              <Avatar
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Luna"
                alt="User avatar"
                size="lg"
              />
              <Avatar
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Max"
                alt="User avatar"
                size="xl"
              />
            </div>
            <div className="flex flex-wrap items-center gap-sm">
              <Avatar alt="No image" size="md" />
              <Avatar alt="With initials" fallbackText="John Doe" size="md" />
              <Avatar alt="Multiple words" fallbackText="Alice Bob Charlie" size="md" />
            </div>
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Spinners</h2>
          <div className="flex flex-wrap items-center gap-md">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner size="md" className="text-red-600" />
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Skeletons</h2>
          <div className="space-y-sm max-w-md">
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
            <div className="flex gap-sm items-center">
              <Skeleton variant="circular" width="48px" height="48px" />
              <div className="flex-1 space-y-xs">
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="70%" />
              </div>
            </div>
            <Skeleton variant="rectangular" width="100%" height="200px" />
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Typography</h2>
          <div className="space-y-sm">
            <h1 className="text-h1">H1 Hero - 48px Bold</h1>
            <h2 className="text-h2">H2 Section - 32px Bold</h2>
            <h3 className="text-h3">H3 Subsection - 24px Bold</h3>
            <h4 className="text-h4">H4 Card Title - 20px Bold</h4>
            <p className="text-body-lg">Body Large - 18px Regular</p>
            <p className="text-body">Body - 16px Regular</p>
            <p className="text-body-sm">Body Small - 14px Medium</p>
            <p className="text-caption">Caption - 12px Medium</p>
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Buttons</h2>
          <div className="flex flex-wrap gap-sm">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
            <button className="btn-primary" disabled>
              Disabled Button
            </button>
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="card-base p-md space-y-xs">
              <h3 className="text-h4">Base Card</h3>
              <p className="text-body-sm">No shadow, just border</p>
            </div>
            <div className="card-elevated p-md space-y-xs">
              <h3 className="text-h4">Elevated Card</h3>
              <p className="text-body-sm">4px brutalist shadow</p>
            </div>
            <div className="card-elevated-lg p-md space-y-xs">
              <h3 className="text-h4">Elevated Large</h3>
              <p className="text-body-sm">6px brutalist shadow</p>
            </div>
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Form Elements</h2>
          <div className="max-w-md space-y-sm">
            <input type="text" placeholder="Input field" className="input-base" />
            <input
              type="text"
              placeholder="Disabled input"
              className="input-base"
              disabled
            />
            <textarea
              placeholder="Textarea"
              className={cn('input-base', 'min-h-[100px] resize-none')}
            />
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Spacing Scale</h2>
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <div className="w-20 text-body-sm">2xs (4px)</div>
              <div className="h-8 w-2xs bg-primary" />
            </div>
            <div className="flex items-center gap-sm">
              <div className="w-20 text-body-sm">xs (8px)</div>
              <div className="h-8 w-xs bg-primary" />
            </div>
            <div className="flex items-center gap-sm">
              <div className="w-20 text-body-sm">sm (16px)</div>
              <div className="h-8 w-sm bg-primary" />
            </div>
            <div className="flex items-center gap-sm">
              <div className="w-20 text-body-sm">md (24px)</div>
              <div className="h-8 w-md bg-primary" />
            </div>
            <div className="flex items-center gap-sm">
              <div className="w-20 text-body-sm">lg (32px)</div>
              <div className="h-8 w-lg bg-primary" />
            </div>
            <div className="flex items-center gap-sm">
              <div className="w-20 text-body-sm">xl (48px)</div>
              <div className="h-8 w-xl bg-primary" />
            </div>
            <div className="flex items-center gap-sm">
              <div className="w-20 text-body-sm">2xl (64px)</div>
              <div className="h-8 w-2xl bg-primary" />
            </div>
            <div className="flex items-center gap-sm">
              <div className="w-20 text-body-sm">3xl (96px)</div>
              <div className="h-8 w-3xl bg-primary" />
            </div>
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-h2">Utility Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="card-elevated p-md shadow-brutalist-hover">
              <h3 className="text-h4">Hover Shadow</h3>
              <p className="text-body-sm">Hover to see shadow increase</p>
            </div>
            <div className="card-elevated p-md translate-brutalist">
              <h3 className="text-h4">Hover Transform</h3>
              <p className="text-body-sm">Hover to see slight movement</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
