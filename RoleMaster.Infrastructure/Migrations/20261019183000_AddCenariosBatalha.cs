using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using RoleMaster.Infrastructure.Data;

#nullable disable

namespace RoleMaster.Infrastructure.Migrations
{
    [DbContext(typeof(RoleMasterDbContext))]
    [Migration("20261019183000_AddCenariosBatalha")]
    public partial class AddCenariosBatalha : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CenariosBatalha",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MesaId = table.Column<string>(type: "text", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Tema = table.Column<string>(type: "text", nullable: false),
                    FundoUrl = table.Column<string>(type: "text", nullable: true),
                    Largura = table.Column<int>(type: "integer", nullable: false),
                    Altura = table.Column<int>(type: "integer", nullable: false),
                    PropsJson = table.Column<string>(type: "text", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CenariosBatalha", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CenariosBatalha_MesaId",
                table: "CenariosBatalha",
                column: "MesaId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CenariosBatalha");
        }
    }
}
