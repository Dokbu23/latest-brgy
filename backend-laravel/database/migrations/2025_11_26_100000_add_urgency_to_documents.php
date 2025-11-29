<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddUrgencyToDocuments extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasColumn('document_requests', 'urgency')) {
            Schema::table('document_requests', function (Blueprint $table) {
                $table->enum('urgency', ['low', 'normal', 'high', 'urgent'])->default('normal')->after('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasColumn('document_requests', 'urgency')) {
            Schema::table('document_requests', function (Blueprint $table) {
                $table->dropColumn('urgency');
            });
        }
    }
}
