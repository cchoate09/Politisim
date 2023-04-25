using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
public class AutoSetStaffPrimary : MonoBehaviour
{
    public StateStaffChoicePrimary ssc;
    public Button mButton;
    public float percAdSpending = 0.4f;
    public string[] dataArr = new string[3];
    public TextAsset txt;
    public List<string> lines;
    public GeneralStaffPayrollPrimary gsp;
    public Slider mslider;
    public GameObject deactivate;

    // Start is called before the first frame update
    void Start()
    {
        mButton.onClick.AddListener(onButtonClick);
    }

    // Update is called once per frame
    void onButtonClick()
    {
        percAdSpending = mslider.value;
        int curPrim = (int)Variables.Saved.Get("curPrimary");
        float delegateTotal = 0;
        float budgetTotal = (float)Variables.Saved.Get("CampaignBalance");
        bool dem = (bool)Variables.Saved.Get("Democrats");
        if (dem)
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimaryStateData_D", typeof(TextAsset));
        }
        else
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimaryStateData_R", typeof(TextAsset));
        }
        lines = (txt.text.Split('\n').ToList());
        for (int i = curPrim; i < Mathf.Min(lines.Count, curPrim + ssc.primariesToRun); i++)
        {
            List<string> l = new List<string>(lines[i].Split('\t').ToList());
            delegateTotal += float.Parse(l[1]);
        }
        for (int i = curPrim; i < Mathf.Min(lines.Count, curPrim + ssc.primariesToRun); i++)
        {
            List<string> l = new List<string>(lines[i].Split('\t').ToList());
            string sName = l[0];
            if (ssc.stateStaffData.ContainsKey(sName))
            {
                float percSpending = float.Parse(l[1])/delegateTotal;
                float adSpend = Mathf.Round(percSpending * percAdSpending * budgetTotal / (3*gsp.salary));
                dataArr[0] = adSpend.ToString();
                dataArr[1] = adSpend.ToString();
                dataArr[2] = adSpend.ToString();
                ssc.stateStaffData[sName] = string.Join('\n', dataArr);
            }
        }
        ssc.DropdownValueChanged(ssc.m_dropdown);
        deactivate.SetActive(false);
    }
}
