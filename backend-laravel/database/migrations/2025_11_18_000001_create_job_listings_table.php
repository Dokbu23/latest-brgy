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
        if (!Schema::hasTable('job_listings')) {
            Schema::create('job_listings', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('company');
                $table->string('type')->nullable();
                $table->string('salary')->nullable();
                $table->text('description')->nullable();
                $table->boolean('urgent')->default(false);
                $table->string('status')->default('open');
                $table->timestamp('posted_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_listings');
    }
};
