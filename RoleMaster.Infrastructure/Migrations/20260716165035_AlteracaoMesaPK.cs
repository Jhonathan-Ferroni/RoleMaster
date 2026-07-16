using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RoleMaster.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AlteracaoMesaPK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SolicitacoesMesa_Mesas_MesaId",
                table: "SolicitacoesMesa");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Mesas",
                table: "Mesas");

            migrationBuilder.DropIndex(
                name: "IX_Mesas_CodigoConvite",
                table: "Mesas");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "Mesas");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Mesas",
                table: "Mesas",
                column: "CodigoConvite");

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitacoesMesa_Mesas_MesaId",
                table: "SolicitacoesMesa",
                column: "MesaId",
                principalTable: "Mesas",
                principalColumn: "CodigoConvite",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SolicitacoesMesa_Mesas_MesaId",
                table: "SolicitacoesMesa");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Mesas",
                table: "Mesas");

            migrationBuilder.AddColumn<string>(
                name: "Id",
                table: "Mesas",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Mesas",
                table: "Mesas",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Mesas_CodigoConvite",
                table: "Mesas",
                column: "CodigoConvite",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitacoesMesa_Mesas_MesaId",
                table: "SolicitacoesMesa",
                column: "MesaId",
                principalTable: "Mesas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
