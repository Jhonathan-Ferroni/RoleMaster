using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RoleMaster.Core.Entities
{
    public class Equipamento : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Damage { get; set; } = string.Empty;
        public string Properties { get; set; } = string.Empty;
    }
}
