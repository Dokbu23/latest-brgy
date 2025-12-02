<?php
// database/migrations/2024_01_01_create_barangay_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBarangayTables extends Migration
{
    public function up()
    {
        // Users table extension for barangay roles
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'barangay_official', 'resident'])->default('resident');
            $table->string('barangay')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->date('birthdate')->nullable();
        });

        // Skills table
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->timestamps();
        });

        // Employment records table
        Schema::create('employment_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('company_name');
            $table->string('position');
            $table->string('employment_type');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('currently_working')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // User skills table
        Schema::create('user_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('skill_id')->constrained()->onDelete('cascade');
            $table->enum('proficiency', ['beginner', 'intermediate', 'advanced', 'expert']);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_skills');
        Schema::dropIfExists('employment_records');
        Schema::dropIfExists('skills');
        
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'barangay', 'phone', 'address', 'birthdate']);
        });
    }
}