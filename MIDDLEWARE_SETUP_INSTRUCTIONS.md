# Admin Middleware Setup Instructions

## Problem
You're getting this error: `Target class [App\Http\Middleware\AdminMiddleware] does not exist.`

## Solution
I've created the missing middleware files. Now you need to register them in your Laravel application.

## Files Created
1. `app/Http/Middleware/AdminMiddleware.php`
2. `app/Http/Middleware/IsAdmin.php`

## Laravel 11+ Registration (bootstrap/app.php)
If you're using Laravel 11+, add this to your `bootstrap/app.php` file:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Register your admin middleware
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'is_admin' => \App\Http\Middleware\IsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

## Laravel 10 and below Registration (app/Http/Kernel.php)
If you're using Laravel 10 or below, add this to your `app/Http/Kernel.php` file:

```php
protected $middlewareAliases = [
    // ... existing middleware aliases
    'admin' => \App\Http\Middleware\AdminMiddleware::class,
    'is_admin' => \App\Http\Middleware\IsAdmin::class,
];
```

## Database Requirement
Make sure your `users` table has an `is_admin` column. If not, create a migration:

```bash
php artisan make:migration add_is_admin_to_users_table
```

Then in the migration file:
```php
public function up()
{
    Schema::table('users', function (Blueprint $table) {
        $table->boolean('is_admin')->default(false);
    });
}
```

Run the migration:
```bash
php artisan migrate
```

## Testing
1. Ensure your Laravel application is running from the correct directory
2. Copy the middleware files to the correct location in your Laravel app
3. Register the middleware as shown above
4. Clear the application cache: `php artisan config:clear && php artisan cache:clear`
5. Access your admin route again

## Notes
- The middleware checks for `Auth::user()->is_admin` property
- Users without admin privileges will get a 403 error
- Non-authenticated users will be redirected to login