using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RoleMaster.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialHybridCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Characters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Classe = table.Column<string>(type: "text", nullable: false),
                    Raca = table.Column<string>(type: "text", nullable: false),
                    Nivel = table.Column<int>(type: "integer", nullable: false),
                    Alinhamento = table.Column<string>(type: "text", nullable: false),
                    Antecedente = table.Column<string>(type: "text", nullable: false),
                    NomeDoJogador = table.Column<string>(type: "text", nullable: false),
                    PontosDeExperiencia = table.Column<int>(type: "integer", nullable: false),
                    Forca = table.Column<int>(type: "integer", nullable: false),
                    StrMod = table.Column<int>(type: "integer", nullable: false),
                    Destreza = table.Column<int>(type: "integer", nullable: false),
                    DexMod = table.Column<int>(type: "integer", nullable: false),
                    Constituicao = table.Column<int>(type: "integer", nullable: false),
                    ConMod = table.Column<int>(type: "integer", nullable: false),
                    Inteligencia = table.Column<int>(type: "integer", nullable: false),
                    IntMod = table.Column<int>(type: "integer", nullable: false),
                    Sabedoria = table.Column<int>(type: "integer", nullable: false),
                    WisMod = table.Column<int>(type: "integer", nullable: false),
                    Carisma = table.Column<int>(type: "integer", nullable: false),
                    ChaMod = table.Column<int>(type: "integer", nullable: false),
                    Inspiracao = table.Column<int>(type: "integer", nullable: false),
                    BonusProficiencia = table.Column<int>(type: "integer", nullable: false),
                    ClasseArmadura = table.Column<int>(type: "integer", nullable: false),
                    Iniciativa = table.Column<int>(type: "integer", nullable: false),
                    Deslocamento = table.Column<int>(type: "integer", nullable: false),
                    PontosDeVidaMaximos = table.Column<int>(type: "integer", nullable: false),
                    PontosDeVidaAtuais = table.Column<int>(type: "integer", nullable: false),
                    PontosDeVidaTemporarios = table.Column<int>(type: "integer", nullable: false),
                    DadoDeVida = table.Column<string>(type: "text", nullable: false),
                    SalvaguardaMorteSucessos = table.Column<int>(type: "integer", nullable: false),
                    SalvaguardaMorteFalhas = table.Column<int>(type: "integer", nullable: false),
                    SalvaGuardaForca = table.Column<bool>(type: "boolean", nullable: false),
                    SalvaGuardaDestreza = table.Column<bool>(type: "boolean", nullable: false),
                    SalvaGuardaConstituicao = table.Column<bool>(type: "boolean", nullable: false),
                    SalvaGuardaInteligencia = table.Column<bool>(type: "boolean", nullable: false),
                    SalvaGuardaSabedoria = table.Column<bool>(type: "boolean", nullable: false),
                    SalvaGuardaCarisma = table.Column<bool>(type: "boolean", nullable: false),
                    Acrobacia = table.Column<int>(type: "integer", nullable: false),
                    Arcanismo = table.Column<int>(type: "integer", nullable: false),
                    Atletismo = table.Column<int>(type: "integer", nullable: false),
                    Atuacao = table.Column<int>(type: "integer", nullable: false),
                    Enganacao = table.Column<int>(type: "integer", nullable: false),
                    Furtividade = table.Column<int>(type: "integer", nullable: false),
                    Historia = table.Column<int>(type: "integer", nullable: false),
                    Intimidacao = table.Column<int>(type: "integer", nullable: false),
                    Intuicao = table.Column<int>(type: "integer", nullable: false),
                    Investigacao = table.Column<int>(type: "integer", nullable: false),
                    LidarComAnimais = table.Column<int>(type: "integer", nullable: false),
                    Medicina = table.Column<int>(type: "integer", nullable: false),
                    Natureza = table.Column<int>(type: "integer", nullable: false),
                    Percepcao = table.Column<int>(type: "integer", nullable: false),
                    Persuasao = table.Column<int>(type: "integer", nullable: false),
                    Prestidigitacao = table.Column<int>(type: "integer", nullable: false),
                    Religiao = table.Column<int>(type: "integer", nullable: false),
                    Sobrevivencia = table.Column<int>(type: "integer", nullable: false),
                    SabedoriaPassivaPercepcao = table.Column<int>(type: "integer", nullable: false),
                    TracosDePersonalidade = table.Column<string>(type: "text", nullable: true),
                    Ideais = table.Column<string>(type: "text", nullable: true),
                    Vinculos = table.Column<string>(type: "text", nullable: true),
                    Fraquezas = table.Column<string>(type: "text", nullable: true),
                    Idade = table.Column<int>(type: "integer", nullable: true),
                    Altura = table.Column<string>(type: "text", nullable: true),
                    Peso = table.Column<string>(type: "text", nullable: true),
                    CorDosOlhos = table.Column<string>(type: "text", nullable: true),
                    CorDaPele = table.Column<string>(type: "text", nullable: true),
                    CorDoCabelo = table.Column<string>(type: "text", nullable: true),
                    AparenciaDoPersonagem = table.Column<string>(type: "text", nullable: true),
                    AliadosEOrganizacoes = table.Column<string>(type: "text", nullable: true),
                    HistoriaDoPersonagem = table.Column<string>(type: "text", nullable: true),
                    OutrasProficienciasEIdiomas = table.Column<string>(type: "text", nullable: true),
                    Tesouros = table.Column<string>(type: "text", nullable: true),
                    CaracteristicasETalentos = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Characters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Equipamentos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Damage = table.Column<string>(type: "text", nullable: false),
                    Properties = table.Column<string>(type: "text", nullable: false),
                    CharacterId = table.Column<int>(type: "integer", nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipamentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Equipamentos_Characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "Characters",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Magias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Properties = table.Column<string>(type: "text", nullable: false),
                    Slot = table.Column<int>(type: "integer", nullable: false),
                    CharacterId = table.Column<int>(type: "integer", nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Magias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Magias_Characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "Characters",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Equipamentos_CharacterId",
                table: "Equipamentos",
                column: "CharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_Magias_CharacterId",
                table: "Magias",
                column: "CharacterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Equipamentos");

            migrationBuilder.DropTable(
                name: "Magias");

            migrationBuilder.DropTable(
                name: "Characters");
        }
    }
}
