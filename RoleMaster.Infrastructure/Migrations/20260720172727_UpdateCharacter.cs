using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RoleMaster.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCharacter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Magias_Characters_CharacterId",
                table: "Magias");

            migrationBuilder.AlterColumn<int>(
                name: "CharacterId",
                table: "Magias",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MesaId",
                table: "Characters",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Characters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UsuarioId",
                table: "Characters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Characters_MesaId",
                table: "Characters",
                column: "MesaId");

            migrationBuilder.CreateIndex(
                name: "IX_Characters_UsuarioId",
                table: "Characters",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Characters_Mesas_MesaId",
                table: "Characters",
                column: "MesaId",
                principalTable: "Mesas",
                principalColumn: "CodigoConvite",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Characters_Usuarios_UsuarioId",
                table: "Characters",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Magias_Characters_CharacterId",
                table: "Magias",
                column: "CharacterId",
                principalTable: "Characters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Characters_Mesas_MesaId",
                table: "Characters");

            migrationBuilder.DropForeignKey(
                name: "FK_Characters_Usuarios_UsuarioId",
                table: "Characters");

            migrationBuilder.DropForeignKey(
                name: "FK_Magias_Characters_CharacterId",
                table: "Magias");

            migrationBuilder.DropIndex(
                name: "IX_Characters_MesaId",
                table: "Characters");

            migrationBuilder.DropIndex(
                name: "IX_Characters_UsuarioId",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "MesaId",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Characters");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Characters");

            migrationBuilder.AlterColumn<int>(
                name: "CharacterId",
                table: "Magias",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_Magias_Characters_CharacterId",
                table: "Magias",
                column: "CharacterId",
                principalTable: "Characters",
                principalColumn: "Id");
        }
    }
}
