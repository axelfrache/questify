import { ModeToggle } from '@/components/mode-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>
            <Separator />

            <div className="space-y-6">
                <section>
                    <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Theme</CardTitle>
                            <CardDescription>
                                Select the theme for the application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label>Interface Theme</Label>
                                <p className="text-sm text-muted-foreground">
                                    Switch between light and dark mode.
                                </p>
                            </div>
                            <ModeToggle />
                        </CardContent>
                    </Card>
                </section>

                {/* Placeholder for future Account settings */}
                <section>
                    <h2 className="text-lg font-semibold mb-4">Account</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>
                                Manage your public profile information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Profile editing features coming soon.
                            </p>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
