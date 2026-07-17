using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RoleMaster.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCloudinaryPublicId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicId",
                table: "MidiasCampanha",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "MidiasCampanha");
        }
    }
}
