using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;


public class GeneralStaffPayrollPrimary : MonoBehaviour
{
    public StateStaffChoicePrimary ssc;
    public float salary = 10000f;

    // Start is called before the first frame update
    void Start()
    {
    }

    // Update is called once per frame
    void Update()
    {
        float amount = 0;
        foreach(KeyValuePair<string,string> stateInfo in ssc.stateStaffData)
        {
            var anArray = ssc.stateStaffData[stateInfo.Key].Split('\n');
            amount += (int.Parse(anArray[0]) + int.Parse(anArray[1]) + int.Parse(anArray[2])) * salary;
        }
        Variables.ActiveScene.Set("staffExpenses", amount);
        string formattedNumber = string.Format("{0:n0}", amount);
        gameObject.GetComponent<TextMeshProUGUI>().text = "Payroll: $" + formattedNumber;
    }
}
