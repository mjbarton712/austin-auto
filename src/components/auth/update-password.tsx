import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { authService } from '../supabase-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export function UpdatePassword() {
    const navigate = useNavigate()
    const location = useLocation()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: ''
        },
    })

    useEffect(() => {
        // Extract access_token from URL hash
        const hashParams = new URLSearchParams(location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (type === 'recovery' && accessToken) {
            // Set the access token in Supabase
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: hashParams.get('refresh_token') || '',
            })
            setLoading(false)
        } else {
            navigate('/sign-in', { replace: true })
        }
    }, [navigate, location])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setError(null)
            const { error } = await authService.updatePassword(values.password)
            if (error) throw error

            // Sign the user out and redirect to sign-in
            await supabase.auth.signOut()
            navigate('/sign-in', {
                replace: true,
                state: { message: 'Password updated successfully. Please log in with your new password.' }
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update password')
        }
    }

    if (loading) {
        return <p className="text-white text-center mt-10">Loading...</p>
    }

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
            <h1 className="text-2xl font-bold text-white mb-6">Set New Password</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">New Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        className="bg-gray-700 text-white border-gray-600"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Confirm Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        className="bg-gray-700 text-white border-gray-600"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full" variant="secondary">
                        Update Password
                    </Button>
                </form>
            </Form>
        </div>
    )
}
