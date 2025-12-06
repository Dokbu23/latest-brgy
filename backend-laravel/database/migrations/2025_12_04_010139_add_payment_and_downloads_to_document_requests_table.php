<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('document_requests', function (Blueprint $table) {
            $table->boolean('is_paid')->default(false)->after('status');
            $table->decimal('amount', 8, 2)->default(0)->after('is_paid');
            $table->integer('download_count')->default(0)->after('amount');
            $table->integer('max_downloads')->default(3)->after('download_count');
            $table->timestamp('expires_at')->nullable()->after('max_downloads');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_requests', function (Blueprint $table) {
            $table->dropColumn(['is_paid', 'amount', 'download_count', 'max_downloads', 'expires_at']);
        });
    }
};
